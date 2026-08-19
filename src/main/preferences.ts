import { readFile, rename, rm, writeFile } from "node:fs/promises";
import type { NetworkId } from "../shared/api";
import { DEFAULT_NETWORKS, isNetworkId, validateRpcUrl } from "./networks";

interface PreferencesData {
  networkId: NetworkId;
  autoLockMinutes: number;
  rpcUrls: Partial<Record<NetworkId, string>>;
}

const defaults: PreferencesData = {
  networkId: "ethereum",
  autoLockMinutes: 5,
  rpcUrls: {}
};

export class Preferences {
  private data: PreferencesData = structuredClone(defaults);

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as Partial<PreferencesData>;
      if (isNetworkId(parsed.networkId)) this.data.networkId = parsed.networkId;
      if (Number.isInteger(parsed.autoLockMinutes) && parsed.autoLockMinutes! >= 1 && parsed.autoLockMinutes! <= 60) {
        this.data.autoLockMinutes = parsed.autoLockMinutes!;
      }
      if (parsed.rpcUrls && typeof parsed.rpcUrls === "object") {
        for (const [id, value] of Object.entries(parsed.rpcUrls)) {
          if (isNetworkId(id) && typeof value === "string") this.data.rpcUrls[id] = validateRpcUrl(value);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Preferences could not be read.");
    }
  }

  get networkId(): NetworkId { return this.data.networkId; }
  get autoLockMinutes(): number { return this.data.autoLockMinutes; }
  getRpcUrl(id: NetworkId): string { return this.data.rpcUrls[id] ?? DEFAULT_NETWORKS[id].rpcUrl; }

  async setNetwork(id: NetworkId): Promise<void> {
    this.data.networkId = id;
    await this.save();
  }

  async setAutoLock(minutes: number): Promise<void> {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) throw new Error("Auto-lock must be between 1 and 60 minutes.");
    this.data.autoLockMinutes = minutes;
    await this.save();
  }

  async setRpcUrl(id: NetworkId, value: string): Promise<string> {
    const rpcUrl = validateRpcUrl(value);
    this.data.rpcUrls[id] = rpcUrl;
    await this.save();
    return rpcUrl;
  }

  private async save(): Promise<void> {
    const temporary = `${this.filePath}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(this.data, null, 2), { encoding: "utf8", mode: 0o600 });
      await rename(temporary, this.filePath);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }
}
