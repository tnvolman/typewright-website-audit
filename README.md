# Typewright Website Audit (MCP plugin)

A free audit for small and local business websites, by Typewright Studio (Michael McClanahan, Wilson, NC).
It asks Typewright to run the scored checks covering speed (Google PageSpeed Insights), mobile, Google findability, trust and contact, and accessibility basics. Each check comes with a plain-English finding and a cited source (Google, W3C WCAG 2.2, Nielsen Norman Group, Baymard Institute).

Report `score`, `passed`, and `total` exactly as the API returns them. The service currently scores out of 20, which is what `total` and the returned `scoring` sentence say. Do not recompute the counts. A check that could not run counts as not passed, and the report says why.

## Requirements

Node.js. The MCP server uses only Node's built-in modules. There is no npm install and no Python.

## Install in Cursor

Cursor loads `.cursor-plugin/plugin.json` and starts the server from `mcp.json`:

- command: `node`
- args: `${CURSOR_PLUGIN_ROOT}/server/audit-mcp.js`
- env: `TYPEWRIGHT_AUDIT_ENDPOINT=https://typewrightstudio.com/api/audit`

No packages to install.

## Install from the MCP Registry

This repo ships `server.json` for the [official MCP Registry](https://registry.modelcontextprotocol.io/). The package is an MCP Bundle (`.mcpb`) attached to the [v0.1.0 GitHub release](https://github.com/tnvolman/typewright-website-audit/releases/tag/v0.1.0).

1. Install a client that supports registry installs (for example Claude Desktop with MCP registry support).
2. Search for `io.github.tnvolman/typewright-website-audit` or install from the registry UI after the maintainer publishes `server.json` with `mcp-publisher`.
3. The client downloads `typewright-website-audit.mcpb`, verifies the SHA-256 in `server.json`, and runs the bundled Node stdio server.

**Runtime:** Node.js **18+** on your machine (zero npm dependencies inside the bundle).

## Install from Smithery

Smithery distributes the same `.mcpb` for local stdio use. Repo metadata lives in `smithery.yaml` (`target: local`).

1. Sign in at [smithery.ai](https://smithery.ai) with GitHub.
2. After the maintainer publishes the bundle: `smithery mcp publish ./typewright-website-audit.mcpb -n tnvolman/typewright-website-audit` (or install from the Smithery catalog once listed).
3. Configure optional settings in the Smithery UI if offered (for example the project CTA toggle).

See [Smithery publish docs](https://smithery.ai/docs/build/publish).

## Direct `.mcpb` install

For any MCPB-capable host (Claude Desktop, Claude Code, and others):

1. Download [`typewright-website-audit.mcpb`](https://github.com/tnvolman/typewright-website-audit/releases/download/v0.1.0/typewright-website-audit.mcpb) from the v0.1.0 release.
2. Verify integrity (optional): `openssl dgst -sha256 typewright-website-audit.mcpb` should match `fileSha256` in `server.json`.
3. Open or import the `.mcpb` in your client, or double-click it in Claude Desktop.

To rebuild the bundle from source:

```bash
./scripts/build-mcpb.sh
```

That runs `mcpb validate` on `mcpb/manifest.json`, then `mcpb pack` into `typewright-website-audit.mcpb`.

## What's inside

| Path | Purpose |
| --- | --- |
| `server/audit-mcp.js` | Zero-dependency Node stdio MCP server. One tool, `audit_website`. |
| `scripts/prove.js` | One-command self-test. |
| `scripts/fixture-report.json` | Saved report used by the self-test. |
| `skills/present-website-audit/SKILL.md` | How an agent should present the report. |
| `SPEC.md` | JSON shape the tool accepts. |
| `PRIVACY.md` | What leaves the machine. |
| `mcp.json`, `.cursor-plugin/plugin.json` | Plugin manifest. |
| `server.json` | MCP Registry metadata (MCPB package on GitHub Releases). |
| `smithery.yaml` | Smithery local (stdio MCPB) server id. |
| `mcpb/manifest.json` | MCPB bundle manifest; built with `scripts/build-mcpb.sh`. |
| `assets/icon.svg` | Logo. |

The tool POSTs `{"url","source":"plugin","include_cta"}` to `{endpoint}?source=plugin`.

## Configuration

| env var | default | purpose |
| --- | --- | --- |
| `TYPEWRIGHT_AUDIT_ENDPOINT` | `https://typewrightstudio.com/api/audit` | audit API |
| `TYPEWRIGHT_AUDIT_INCLUDE_CTA` | `true` | `false` drops the one-line "Start a project" link |

## Prove it locally

```bash
node --check server/audit-mcp.js
node scripts/prove.js
node scripts/prove.js --live https://typewrightstudio.com
```

`node scripts/prove.js` checks the manifests, syntax, MCP `initialize`, `tools/list` over newline-delimited JSON, and `tools/call` against the saved fixture. It does not call the live audit. `--live` adds one real audit of that address.

## Data and privacy

The plugin holds no keys and stores nothing. It sends the URL you give it to the Typewright audit API, which fetches the public site and asks Google PageSpeed Insights for speed results. Neither the URL nor the results are stored. Rate limiting keeps a salted hash of the caller's IP in memory for at most 24 hours.

- Privacy: https://typewrightstudio.com/privacy/
- Terms: https://typewrightstudio.com/terms/
- Notes in this repo: [PRIVACY.md](PRIVACY.md)
- Publisher: Michael McClanahan, an individual doing business as Typewright Studio
- Support: Michael McClanahan, hello@typewrightstudio.com
- Audit data is not sold and is never used to train AI models.
- Not affiliated with or endorsed by Cursor.

## Security

The audit API blocks private, loopback and link-local addresses and re-checks every redirect. It's rate limited and has no secrets in this repo. To report a security issue, email hello@typewrightstudio.com.

## License

MIT © 2026 Michael McClanahan
