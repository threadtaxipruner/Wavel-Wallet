<div align="center">
  <img src="docs/assets/wavel-mark.svg" width="112" alt="Wavel Wallet logo">
  <h1>Wavel Wallet</h1>
  <p><strong>An open specification for a self-custody multichain desktop wallet.</strong></p>
  <p>Designed for Windows and macOS with security, clarity, and verifiability as first-class requirements.</p>

  [![Status: concept](https://img.shields.io/badge/status-concept%20%2F%20pre--alpha-f5a623)](docs/ROADMAP.md)
  [![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS-7650ff)](docs/PRODUCT.md)
  [![License: MIT](https://img.shields.io/badge/license-MIT-32c48d)](LICENSE)
</div>

> [!WARNING]
> Wavel is currently a **product and technical specification**, not a released wallet.
> This repository does not contain production wallet binaries or an audited signing
> implementation. Do not use it to store funds and do not download applications
> claiming to be official Wavel releases.

## Overview

Wavel is a proposed non-custodial desktop wallet that brings accounts, tokens,
collectibles, swaps, and dApp connections into one focused application. The goal is
to make multichain ownership understandable without hiding network fees, signing
requests, approval scope, or recovery responsibilities from the user.

The project is guided by five principles:

1. **Keys stay local.** Secret material must never be sent to Wavel services.
2. **Signing is explicit.** Every signature must have human-readable context.
3. **Networks are isolated.** A failure in one integration must not compromise others.
4. **Privacy is the default.** No wallet addresses or activity analytics without consent.
5. **Releases are verifiable.** Published artifacts should be signed and reproducible.

## Project Status

| Area | Status | Notes |
| --- | --- | --- |
| Product specification | In progress | Core flows and scope are documented |
| Architecture | Proposed | Subject to review before implementation |
| Threat model | Initial draft | Requires independent security review |
| Wallet core | Not implemented | No key generation or signing code is published |
| Desktop application | Not implemented | Windows and macOS are target platforms |
| Security audit | Not started | No audit claims are made |
| Official releases | None | GitHub Releases is currently empty by design |

See the [roadmap](docs/ROADMAP.md) for clear delivery gates.

## Intended Experience

### One portfolio

Wavel is designed to combine native assets, fungible tokens, and collectibles while
retaining the network and account context of every balance. Fiat values are display
metadata only and never replace on-chain amounts.

### Safer transactions

Before signing, Wavel should show the recipient, asset, amount, selected network,
estimated fee, contract interaction, token approvals, and simulation warnings. Raw
calldata remains available for expert review.

### Desktop-first security

The target application uses a narrow desktop shell around an isolated wallet core.
The UI cannot read plaintext secrets. Sensitive operations cross a typed command
boundary and require an unlocked session plus explicit user confirmation.

### Portable recovery

The proposed first release uses standard BIP-39 recovery phrases and established
derivation standards rather than a Wavel-specific backup format. Hardware-wallet
support is preferred before expanding to high-risk protocol integrations.

## Proposed Feature Set

| Capability | Initial scope | Long-term direction |
| --- | --- | --- |
| Wallets | Create/import, multiple accounts, receive/send | Hardware wallets, watch-only accounts |
| Assets | Native coins and common tokens | Curated token lists and spam filtering |
| Networks | Selected EVM networks first | Bitcoin, Solana, and additional ecosystems |
| Collectibles | Read-only gallery | Transfer and richer metadata controls |
| dApps | WalletConnect sessions | Granular permissions and session policies |
| Swaps | Quote comparison and transparent fees | Cross-chain routing after security review |
| Security | Encrypted local vault and auto-lock | OS-backed protection and external signing |

All capabilities above are requirements unless explicitly marked as shipped in the
[roadmap](docs/ROADMAP.md).

## Proposed Networks

Implementation is intentionally phased. Similar address formats do not imply similar
security assumptions.

**Phase 1 candidates:** Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, and
Avalanche C-Chain.

**Research candidates:** Bitcoin, Solana, Cosmos, Polkadot, Cardano, NEAR, TON, TRON,
Sui, Aptos, Algorand, and XRP Ledger.

No network is considered supported until its adapter, transaction parser, tests, and
release checklist are complete. Read the [network policy](docs/NETWORKS.md).

## Architecture At A Glance

```text
┌──────────────────────── Desktop UI ────────────────────────┐
│ Portfolio · Accounts · Receive · Send · Activity · dApps  │
└───────────────────────────┬────────────────────────────────┘
                            │ typed, allowlisted commands
┌───────────────────────────▼────────────────────────────────┐
│ Application controller                                    │
│ Session lock · permissions · transaction review · policy  │
└───────────────┬────────────────────────────┬───────────────┘
                │                            │
┌───────────────▼──────────────┐  ┌─────────▼────────────────┐
│ Isolated wallet core         │  │ Network adapters          │
│ Vault · derivation · signing │  │ RPC · indexing · decoding │
└───────────────┬──────────────┘  └─────────┬────────────────┘
                │                            │
        encrypted local data          untrusted providers
```

The complete proposal is in [Architecture](docs/ARCHITECTURE.md).

## Security Model

Wavel assumes the renderer, RPC endpoints, token metadata, dApps, and remote content
can be malicious. Private keys should exist in plaintext only inside the isolated
wallet core for the shortest practical time. The application must never log recovery
phrases, private keys, passwords, raw vaults, or complete address histories.

The initial threat model covers:

- Theft of the local encrypted vault
- Malicious websites and WalletConnect peers
- Compromised or dishonest RPC providers
- Clipboard replacement and address poisoning
- Unlimited token approvals and deceptive calldata
- Dependency, build pipeline, and release-channel compromise
- Screen capture, crash dumps, swap files, and diagnostic logs

Read [Security Model](docs/SECURITY-MODEL.md) and [Security Policy](SECURITY.md).

## Repository Map

```text
docs/
├── ARCHITECTURE.md       Proposed components and trust boundaries
├── NETWORKS.md           Network admission and adapter requirements
├── PRODUCT.md            Personas, flows, UX rules, and non-goals
├── ROADMAP.md            Delivery phases and release gates
├── SECURITY-MODEL.md     Assets, threats, controls, and residual risk
└── assets/               Public project artwork
.github/                  Contribution and issue templates
CONTRIBUTING.md           How to propose and review changes
SECURITY.md               Private vulnerability reporting policy
```

## Development

There is no runnable wallet yet. The next implementation step is an architecture
decision record selecting the desktop shell and wallet-core language. Source code,
build commands, tests, and CI badges will be added only when they exist and work from
a clean checkout.

To contribute now, review an open proposal or submit a focused design issue. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Releases And Verification

Wavel has no official releases today. A future release is not considered valid unless:

- It is published under this repository's GitHub Releases page
- Its source tag is signed by a documented maintainer key
- SHA-256 checksums and signatures are provided
- CI provenance is attached to each artifact
- Windows and macOS artifacts pass the release security checklist
- Reproducible-build differences are documented

Never trust download links from advertisements, direct messages, or unrelated domains.

## Documentation

- [Product specification](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY-MODEL.md)
- [Network support policy](docs/NETWORKS.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)

## License

Documentation and future source code in this repository are available under the
[MIT License](LICENSE). Third-party protocols, trademarks, and network names remain
the property of their respective owners.
