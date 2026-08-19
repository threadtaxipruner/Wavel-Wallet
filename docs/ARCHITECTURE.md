# Proposed Architecture

## Goals

- Keep private keys outside the UI process.
- Minimize trusted code and remotely supplied data.
- Make chain integrations replaceable and independently testable.
- Support deterministic transaction review before signing.
- Produce signed Windows and macOS builds from tagged source.

## Components

### Desktop shell

Owns windows, deep links, OS integration, updates, and the application lifecycle. It
must deny arbitrary navigation, disable Node-style capabilities in web views, enforce
a strict content security policy, and expose only allowlisted commands.

### User interface

Renders portfolio data and confirmation screens. The UI is considered less trusted
than the wallet core. It receives public account data and typed responses, but never
plaintext seeds or private keys after onboarding.

### Application controller

Coordinates session locking, account selection, permissions, transaction review,
network routing, and policy checks. Every sensitive command must include purpose,
origin, network, and an explicit confirmation context.

### Wallet core

Owns entropy generation, mnemonic handling, hierarchical derivation, vault encryption,
key lifetimes, signing, and hardware-wallet communication. It should run in an isolated
process with no general network access.

### Network adapters

Normalize balances, fees, transaction building, simulation, broadcast, and history.
Adapters consume untrusted RPC responses and must validate chain identifiers, response
shape, numeric bounds, and transaction serialization independently.

### Local storage

Separates encrypted secrets from non-secret cache and preferences. Deleting caches
must never delete the vault. Backups must clearly identify which data is sufficient
to recover funds.

## Trust Boundaries

| Boundary | Allowed data | Forbidden data |
| --- | --- | --- |
| UI to controller | Typed user intent and public values | Arbitrary commands or code |
| Controller to wallet core | Canonical transaction request | Remote HTML or unvalidated RPC objects |
| Wallet core to UI | Address, signature result, status | Seed, private key, vault password |
| Adapter to RPC | Public addresses and network requests | Secret material |
| Diagnostics to support | User-reviewed redacted logs | Addresses, keys, phrases, passwords, raw vaults |

## Key Lifecycle

1. Generate entropy through a cryptographically secure OS source.
2. Convert to a standards-based recovery representation.
3. Keep phrase display isolated from analytics, logs, and remote content.
4. Derive keys in the wallet-core process only.
5. Encrypt persisted material with a versioned, memory-hard KDF and authenticated cipher.
6. Hold decrypted keys only while the session is unlocked.
7. Clear sensitive buffers on lock where the runtime permits; document runtime limits.
8. Require reauthentication for phrase export, high-risk signing, and security changes.

Exact cryptographic choices require an architecture decision record and expert review
before implementation. Custom cryptography is prohibited.

## Transaction Pipeline

```text
User intent
  -> address and amount validation
  -> network-specific canonical transaction
  -> independent fee calculation
  -> simulation and calldata decoding
  -> policy and risk checks
  -> immutable confirmation model
  -> wallet-core signature
  -> serialization verification
  -> broadcast
  -> local activity record
```

The object shown on the final confirmation screen must be cryptographically tied to
the exact payload signed by the wallet core. Any mutation restarts confirmation.

## Dependency Policy

- Prefer mature, narrowly scoped cryptographic libraries with active maintenance.
- Pin release dependencies and commit lockfiles.
- Generate a software bill of materials for releases.
- Run license, vulnerability, and provenance checks in CI.
- Avoid runtime code loaded from CDNs or remote origins.
- Treat update infrastructure and package registries as supply-chain threats.

## Release Architecture

Tagged commits should trigger isolated Windows and macOS builds. Artifacts require
checksums, signatures, build provenance, malware scanning, and notarization or code
signing where applicable. Maintainers must document signing-key ownership and incident
recovery before the first release.

## Decisions Still Required

- Desktop shell and wallet-core implementation languages
- Process isolation and IPC transport
- Vault KDF, authenticated cipher, and parameter migration
- Hardware-wallet protocol libraries
- Indexing strategy and privacy-preserving provider defaults
- Update mechanism and rollback protection
- Reproducible build environment for both platforms
