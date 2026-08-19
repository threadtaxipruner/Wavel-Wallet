import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import type { SafeStorage } from "electron";
import { decryptPayload, encryptPayload, type EncryptedPayload } from "./vault-crypto";

interface VaultFile {
  format: 1;
  password?: EncryptedPayload;
  osProtected?: string;
}

export class VaultStore {
  constructor(private readonly filePath: string, private readonly safeStorage: SafeStorage) {}

  async exists(): Promise<boolean> {
    try {
      await access(this.filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async save(mnemonic: string, password: string): Promise<void> {
    if (await this.exists()) throw new Error("A wallet already exists on this device.");

    const bytes = Buffer.from(mnemonic, "utf8");
    try {
      const encrypted = await encryptPayload(bytes, password);
      const vault: VaultFile = { format: 1 };
      if (this.safeStorage.isEncryptionAvailable()) {
        vault.osProtected = this.safeStorage.encryptString(JSON.stringify(encrypted)).toString("base64");
      } else {
        vault.password = encrypted;
      }
      await this.writeAtomic(vault);
    } finally {
      bytes.fill(0);
    }
  }

  async unlock(password: string): Promise<string> {
    const vault = await this.read();
    let encrypted = vault.password;
    if (vault.osProtected) {
      if (!this.safeStorage.isEncryptionAvailable()) throw new Error("Operating system vault protection is unavailable.");
      try {
        encrypted = JSON.parse(this.safeStorage.decryptString(Buffer.from(vault.osProtected, "base64"))) as EncryptedPayload;
      } catch {
        throw new Error("Operating system vault protection could not be unlocked.");
      }
    }
    if (!encrypted) throw new Error("Unsupported or damaged vault file.");
    const plaintext = await decryptPayload(encrypted, password);
    try {
      return plaintext.toString("utf8");
    } finally {
      plaintext.fill(0);
    }
  }

  private async read(): Promise<VaultFile> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("No wallet exists on this device.");
      throw new Error("The vault file could not be read.");
    }
    if (!parsed || typeof parsed !== "object" || (parsed as VaultFile).format !== 1 || (!(parsed as VaultFile).password && !(parsed as VaultFile).osProtected)) {
      throw new Error("Unsupported or damaged vault file.");
    }
    return parsed as VaultFile;
  }

  private async writeAtomic(vault: VaultFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(vault), { encoding: "utf8", mode: 0o600, flag: "wx" });
      await rename(temporary, this.filePath);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }
}
