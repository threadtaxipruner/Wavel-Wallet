import { describe, expect, it } from "vitest";
import { decryptPayload, encryptPayload } from "./vault-crypto";

describe("vault cryptography", () => {
  it("round trips plaintext without storing it", async () => {
    const secret = Buffer.from("test test test test test test test test test test test junk");
    const encrypted = await encryptPayload(secret, "correct horse battery staple");
    expect(JSON.stringify(encrypted)).not.toContain(secret.toString());
    expect((await decryptPayload(encrypted, "correct horse battery staple")).equals(secret)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const encrypted = await encryptPayload(Buffer.from("secret"), "correct horse battery staple");
    await expect(decryptPayload(encrypted, "not the correct password")).rejects.toThrow("Incorrect password or damaged vault");
  });

  it("rejects modified ciphertext", async () => {
    const encrypted = await encryptPayload(Buffer.from("secret"), "correct horse battery staple");
    const bytes = Buffer.from(encrypted.ciphertext, "base64");
    bytes[0] ^= 1;
    encrypted.ciphertext = bytes.toString("base64");
    await expect(decryptPayload(encrypted, "correct horse battery staple")).rejects.toThrow("Incorrect password or damaged vault");
  });

  it("enforces a minimum password length", async () => {
    await expect(encryptPayload(Buffer.from("secret"), "short")).rejects.toThrow("at least 10 characters");
  });
});
