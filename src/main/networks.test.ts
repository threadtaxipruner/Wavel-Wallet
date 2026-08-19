import { describe, expect, it } from "vitest";
import { validateRpcUrl } from "./networks";

describe("RPC URL validation", () => {
  it("allows keyless HTTPS and local HTTP endpoints", () => {
    expect(validateRpcUrl("https://rpc.example.org/path")).toBe("https://rpc.example.org/path");
    expect(validateRpcUrl("http://127.0.0.1:8545")).toBe("http://127.0.0.1:8545");
  });

  it.each([
    "http://rpc.example.org",
    "https://user:password@rpc.example.org",
    "https://rpc.example.org/?apiKey=secret",
    "file:///vault"
  ])("rejects unsafe endpoint %s", (value) => {
    expect(() => validateRpcUrl(value)).toThrow();
  });
});
