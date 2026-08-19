# Wavel Website

The open-source website and documentation for Wavel, a self-custody wallet project.

> [!IMPORTANT]
> This repository contains the public website, documentation, and brand assets. The
> wallet client, browser extension, desktop application, signing logic, and key
> management implementation were not present in the source deployment used to
> create this repository and are therefore not included.

## What's included

- Responsive product landing page
- Documentation and security guidance
- Help center, FAQ, legal, careers, and changelog pages
- Reusable public brand and product assets
- Minimal Nginx and Docker Compose configuration

The public version intentionally excludes production secrets, TLS private keys,
visitor and wallet-provider telemetry, applicant data, internal administration
tools, databases, server backups, and executable download redirects.

## Run locally

Docker is the only prerequisite:

```sh
docker compose up
```

Open <http://localhost:8080>.

You can also serve `site/` with any static HTTP server:

```sh
python -m http.server 8080 --directory site
```

## Project structure

```text
site/                 Static website, documentation, and assets
docker-compose.yml    Local container setup
nginx.conf            Static production-style web server configuration
```

## Security

Never share a recovery phrase, private key, or password with a website or support
agent. See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening
a pull request.

## License

Licensed under the [MIT License](LICENSE).
