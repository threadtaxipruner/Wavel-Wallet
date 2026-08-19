import { createCipheriv, createDecipheriv, randomBytes, scrypt as nodeScrypt } from "node:crypto";

const KEY_BYTES = 32;
const SCRYPT_OPTIONS = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;

export interface EncryptedPayload {
  version: 1;
  kdf: "scrypt";
  cipher: "aes-256-gcm";
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export async function encryptPayload(plaintext: Buffer, password: string): Promise<EncryptedPayload> {
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  try {
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      version: 1,
      kdf: "scrypt",
      cipher: "aes-256-gcm",
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64")
    };
  } finally {
    key.fill(0);
  }
}

export async function decryptPayload(payload: EncryptedPayload, password: string): Promise<Buffer> {
  if (payload.version !== 1 || payload.kdf !== "scrypt" || payload.cipher !== "aes-256-gcm") {
    throw new Error("Unsupported vault format.");
  }

  const salt = strictBase64(payload.salt, 16, "salt");
  const iv = strictBase64(payload.iv, 12, "IV");
  const tag = strictBase64(payload.tag, 16, "authentication tag");
  const ciphertext = strictBase64(payload.ciphertext, undefined, "ciphertext");
  const key = await deriveKey(password, salt);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("Incorrect password or damaged vault.");
  } finally {
    key.fill(0);
  }
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, KEY_BYTES, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function strictBase64(value: unknown, expectedLength: number | undefined, name: string): Buffer {
  if (typeof value !== "string" || value.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`Invalid vault ${name}.`);
  }
  const decoded = Buffer.from(value, "base64");
  if (expectedLength !== undefined && decoded.length !== expectedLength) {
    throw new Error(`Invalid vault ${name}.`);
  }
  return decoded;
}
