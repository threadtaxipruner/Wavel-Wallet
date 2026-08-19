# Network Support Policy

## Admission Criteria

A network is supported only when all requirements below are met:

- Maintained protocol and serialization libraries are available
- Address and amount validation have conformance tests
- Transaction construction and signing use published standards
- Fee estimation failures degrade safely
- Common transaction types can be decoded for confirmation
- RPC chain identity is verified
- Broadcast and receipt handling are tested
- Privacy implications and external providers are documented
- A maintainer is assigned to security and protocol updates

Marketing references or shared address formats do not constitute support.

## Rollout

### Stage 1: EVM foundation - MVP source

The desktop MVP supports native balances and native transfers on Ethereum, Base,
Arbitrum One, Optimism, and Polygon. Each keeps an independent chain ID, native asset,
explorer, and configurable RPC URL. Tokens and transaction history are not implemented.

### Stage 2: Hardware and dApp maturity

Before adding unrelated ecosystems, prioritize hardware-wallet signing, WalletConnect,
approval management, transaction simulation, custom RPC endpoints, and provider health.

### Stage 3: Independent ecosystems

Bitcoin and Solana require separate account, fee, transaction, and signing models.
They should be implemented as independent adapters, not approximated through EVM
abstractions.

### Research backlog

Cosmos, Polkadot, Cardano, NEAR, TON, TRON, Sui, Aptos, Algorand, and XRP Ledger may
be evaluated after the first security-reviewed release. Listing here is not a promise
or statement of current support.

## Asset Policy

- Native assets use chain-defined metadata.
- Token metadata is untrusted and must be attributable to a source.
- Unknown tokens are hidden by default but remain discoverable.
- Spam filtering must be reversible and must not alter balances.
- Token logos and fiat prices never authorize a transaction.
- Contract addresses are always available for verification.

## Provider Policy

Default providers must be documented, replaceable, rate-limit tolerant, and prohibited
from receiving secret material. Custom RPC support is a release requirement. Provider
failures must not silently switch networks or construct a transaction with a different
chain ID.
