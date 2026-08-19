# Roadmap

The roadmap uses security and quality gates rather than promised dates. Checked items
exist in source; a checked item does not imply an audit or production-security claim.

## Desktop EVM MVP - Shipped Source

- [x] Electron, TypeScript, and Vite Windows application
- [x] Sandboxed/context-isolated renderer and typed allowlisted IPC
- [x] BIP-39 create/import and one EVM account at `m/44'/60'/0'/0/0`
- [x] Versioned scrypt and AES-256-GCM vault wrapped by OS `safeStorage` when available
- [x] Ethereum, Base, Arbitrum One, Optimism, and Polygon native balances
- [x] Receive/address copy and native-asset sends with fee review
- [x] Expiring immutable transaction confirmation before signing and broadcast
- [x] Chain-ID-verified configurable RPC endpoints
- [x] Lock, automatic lock, vault crypto tests, CI, and unsigned Windows NSIS packaging

## Beta Hardening - In Progress

- [ ] Independent security review and remediation
- [ ] Signed Windows installer and documented signing-key ownership
- [ ] End-to-end transaction tests against controlled development chains
- [ ] Vault corruption, migration, and recovery test expansion
- [ ] Transaction simulation and richer calldata review
- [ ] Reproducible-build analysis and dependency SBOM
- [ ] Privacy/provider failover design that never silently changes chain

## Wallet Expansion - Planned

- [ ] Multiple accounts and watch-only accounts
- [ ] Fungible token balances, transfers, and approval management
- [ ] Transaction history with explicit indexing privacy controls
- [ ] Hardware-wallet integration
- [ ] WalletConnect with granular permissions
- [ ] Signed and notarized macOS package

## Research

- [ ] Bitcoin and Solana adapter proposals
- [ ] Collectible support
- [ ] Swap aggregation threat model
- [ ] Privacy-preserving indexing

Cross-chain swaps, bridges, lending, and other high-risk integrations remain out of
scope until separately threat-modeled and reviewed.
