# Security Model

## Status

This is an initial threat model for a future implementation. It has not been audited.

## Protected Assets

- Recovery phrases and derived private keys
- Vault passwords and unlocked sessions
- Transaction intent and signatures
- Account labels, balances, and activity history
- dApp permissions and connection metadata
- Release signing keys and update metadata

## Adversaries

- An attacker who steals the encrypted local vault
- Malware with ordinary user-level access
- A malicious website, dApp, or WalletConnect peer
- A dishonest RPC, price, token-metadata, or simulation provider
- A compromised dependency, maintainer account, CI worker, or update server
- An attacker with temporary physical access to an unlocked computer

## Security Controls

### Local vault theft

Use authenticated encryption, a memory-hard password derivation function, per-vault
salt, versioned parameters, and a password-strength floor. Never persist plaintext
secrets or reversible password hints.

### Malicious transaction requests

Canonicalize the request, bind confirmation to the signed bytes, decode known methods,
simulate state changes, highlight approvals, and provide raw details. Unknown decoding
must be shown as unknown rather than guessed.

### RPC manipulation

Validate chain IDs and responses, compare critical data across providers where
practical, verify receipts, expose custom endpoints, and never use RPC data as trusted
input to key derivation or signing policy.

### Address replacement

Detect clipboard changes, preserve complete-address inspection, maintain optional local
address-book labels, warn about lookalike history poisoning, and support hardware-screen
verification.

### Desktop compromise

Use process isolation, sandboxing, least privilege, strict IPC schemas, no remote code,
automatic locking, safe crash handling, and OS protections. A fully compromised OS can
still capture input or alter displays; hardware wallets are the primary mitigation.

### Supply chain

Require protected branches, reviewed changes, pinned dependencies, secret scanning,
isolated CI, signed commits or tags, artifact provenance, reproducible builds, and a
documented emergency release process.

## Required Security Tests

- Known-answer tests for derivation and serialization
- Vault format corruption and password-failure tests
- Property and fuzz tests for transaction parsers
- IPC authorization and schema tests
- Malicious RPC fixture tests
- Update signature and rollback tests
- Dependency and secret scans
- Platform packaging smoke tests
- Manual review of recovery, signing, export, and diagnostics flows

## Explicit Limitations

- No software wallet can protect keys from a fully compromised host while unlocked.
- Transaction simulation can be stale, censored, or inconsistent with execution.
- Fiat prices and token metadata are informational and may be incorrect.
- Self-custody means Wavel cannot recover a lost phrase or forgotten vault password.
- Unsupported chains and contracts may not be decoded safely.

## Security Release Gate

No production-ready claim should be made until the implementation has an independent
assessment, all critical findings are resolved, the public reporting channel works,
release verification is documented, and maintainers have tested incident response.
