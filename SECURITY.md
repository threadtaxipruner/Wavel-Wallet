# Security Policy

## Current Status

Wavel Wallet is an unaudited beta implementation capable of signing mainnet
transactions. The source and unsigned Windows packaging configuration are public, but
there has been no independent security assessment. Use only generated test fixtures
when reporting issues and begin with small amounts if evaluating the application.

## Reporting

Do not publish suspected vulnerabilities in a public issue. Use GitHub's private
security advisory feature for this repository. Include the affected document or
component, impact, reproduction steps, and a suggested mitigation when possible.

Never include a real recovery phrase, private key, password, wallet file, user record,
or production credential. Use generated test fixtures and redact sensitive evidence.

## Response Targets

These are best-effort maintainer targets, not guaranteed service levels:

| Severity | Initial response target |
| --- | --- |
| Critical | 24 hours |
| High | 3 business days |
| Medium | 7 business days |
| Low | 14 business days |

Targets are not a bug bounty or guarantee of payment. Any future bounty program will
be announced in this file and on the official repository.

## Supported Versions

No production version is currently supported. The `0.1.x-beta` source line is the
current development line and receives fixes without a long-term support commitment.
