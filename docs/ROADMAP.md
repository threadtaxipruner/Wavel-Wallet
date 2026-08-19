# Roadmap

The roadmap uses security and quality gates rather than delivery dates. Items are
proposals until linked to merged source and a published release.

## Phase 0: Specification - In progress

- [x] Product scope and non-goals
- [x] Proposed architecture and trust boundaries
- [x] Initial threat model
- [x] Network admission policy
- [ ] Architecture decision records for implementation stack and vault format
- [ ] Maintainer and governance model

## Phase 1: Offline Prototype - Planned

- [ ] Isolated wallet core
- [ ] BIP-39 create and restore flows
- [ ] Encrypted, versioned local vault
- [ ] Multiple EVM accounts and watch-only mode
- [ ] Session lock and sensitive-memory review
- [ ] Known-answer, corruption, and migration tests

**Gate:** no network access is enabled until key lifecycle tests and internal security
review pass.

## Phase 2: EVM Preview - Planned

- [ ] Network adapter interface
- [ ] Read-only balances and activity
- [ ] Receive flow with QR and chain context
- [ ] Native-asset send with fee review
- [ ] Transaction simulation and decoded confirmation
- [ ] Custom RPC endpoints

**Gate:** preview builds use testnets only and display an experimental warning.

## Phase 3: Public Beta - Proposed

- [ ] Selected EVM mainnets
- [ ] Fungible tokens and approval management
- [ ] WalletConnect sessions
- [ ] Hardware-wallet integration
- [ ] Signed Windows installer
- [ ] Signed and notarized macOS package
- [ ] Checksums, provenance, and reproducible-build instructions

**Gate:** independent assessment completed with no unresolved critical findings.

## Phase 4: Ecosystem Expansion - Research

- [ ] Bitcoin adapter proposal
- [ ] Solana adapter proposal
- [ ] Collectible transfers
- [ ] Swap aggregation threat model
- [ ] Privacy-preserving indexing research

Cross-chain swaps, bridges, lending, and other high-risk integrations remain out of
scope until their separate threat models are approved.
