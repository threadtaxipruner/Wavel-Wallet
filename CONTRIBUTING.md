# Contributing To Wavel

Wavel currently accepts product, architecture, security, network, and implementation
proposals. Accuracy and explicit assumptions matter more than feature count.

## Before Opening A Pull Request

1. Search existing issues and discussions.
2. Open a design issue for changes to cryptography, vault storage, signing, updates,
   telemetry, network support, or release infrastructure.
3. Keep one pull request focused on one decision or behavior.
4. State whether the change is implemented, proposed, experimental, or shipped.
5. Include security and privacy implications.

## Documentation Style

- Use direct, testable statements.
- Distinguish requirements from current behavior.
- Do not claim an audit, partnership, network support, or release without evidence.
- Define acronyms and link primary protocol specifications.
- Avoid real addresses, credentials, recovery phrases, and personal information.

## Future Code Contributions

Implementation pull requests will require tests, threat-model updates for new trust
boundaries, dependency justification, platform verification, and documentation of
failure behavior. Cryptographic primitives must come from reviewed libraries; custom
cryptography is not accepted.

## Security Reports

Do not report vulnerabilities through public issues. Follow [SECURITY.md](SECURITY.md).
