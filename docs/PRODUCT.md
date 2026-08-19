# Product Specification

## Product Definition

Wavel Wallet is a proposed self-custody desktop application for Windows and macOS.
It should let users create or restore accounts, understand their multichain portfolio,
receive and send assets, inspect activity, connect to dApps, and review transactions
without surrendering control of private keys.

This document defines intended behavior. It is not evidence that a feature has been
implemented, audited, or released.

## Users

### Everyday holder

Needs a clear portfolio, reliable receive addresses, understandable transfer fees,
and recovery guidance without protocol jargon.

### Active on-chain user

Needs multiple accounts, token and collectible management, dApp sessions, swaps,
approval visibility, and transaction simulation.

### Security-conscious user

Needs hardware-wallet support, deterministic builds, minimal telemetry, verifiable
releases, custom RPC endpoints, and access to raw transaction details.

## Core Flows

### Create a wallet

1. Explain self-custody and the consequences of losing the recovery phrase.
2. Create entropy using an operating-system cryptographic random source.
3. Display the recovery phrase in a protected view with capture warnings.
4. Verify selected words before account activation.
5. Encrypt the local vault using a memory-hard password derivation function.
6. Require an initial offline recovery test recommendation.

### Restore a wallet

1. Keep phrase input local and disable remote content in the restore view.
2. Validate word count and checksum without transmitting words.
3. Let the user select known derivation paths or perform local discovery.
4. Show discovered public accounts before persisting the encrypted vault.
5. Never reveal whether a phrase has funds to a Wavel-controlled service.

### Receive assets

1. Select account and network before showing an address.
2. Display text and QR representations from the same canonical address.
3. Warn when the selected asset uses a different network.
4. Support address verification on connected hardware devices when available.

### Send assets

1. Validate address syntax and resolve names using the selected network only.
2. Detect clipboard changes and compare the complete address, not a shortened form.
3. Show amount, asset, recipient, network, estimated fee, and resulting balance.
4. Simulate contract calls and decode known actions before confirmation.
5. Require a second confirmation for unlimited approvals or high-risk warnings.
6. Return a transaction hash and explorer link after broadcast.

### Connect a dApp

1. Show origin, requested chains, accounts, methods, and expiry.
2. Grant the smallest useful permission set.
3. Keep sessions visible and individually revocable.
4. Require confirmation for every signing request unless an explicit bounded policy exists.

## Information Architecture

| Area | Purpose |
| --- | --- |
| Portfolio | Consolidated balances with network and account filters |
| Accounts | Wallets, addresses, derivation paths, and labels |
| Activity | Local and indexed transaction history with status |
| Discover | Optional curated dApps with external-content isolation |
| Connections | Active WalletConnect sessions and permissions |
| Settings | Security, networks, RPC, currency, privacy, and diagnostics |

## UX Requirements

- Never ask for a recovery phrase outside create/restore flows.
- Never shorten both the beginning and end of an address at final confirmation.
- Distinguish estimated fiat values from canonical on-chain amounts.
- Explain network fees before confirmation and identify who receives them.
- Keep destructive actions visually and spatially separate from routine actions.
- Support keyboard navigation, screen readers, reduced motion, and 200% scaling.
- Maintain usable layouts at the minimum desktop window size.
- Avoid urgency language in signing and security prompts.

## Privacy Requirements

- No telemetry by default during onboarding.
- No collection of installed wallet providers, IP geolocation, or address histories.
- Diagnostics must be opt-in, previewable, redactable, and time-bounded.
- Price, token, and RPC requests should be documented with their privacy implications.
- Custom RPC endpoints must remain available for users who avoid shared providers.

## Non-Goals For The First Release

- Running full nodes inside the application
- Custody, account recovery by Wavel, or password resets
- Leveraged trading, lending, bridges, or cross-chain swaps
- Browser extension support
- Mobile applications
- Automatic signing without a visible user-approved policy
- Proprietary recovery formats

## Success Gates

The first public beta should not ship until critical user flows have automated tests,
the threat model is reviewed, production dependencies are audited, releases are signed,
and an independent security assessment has no unresolved critical findings.
