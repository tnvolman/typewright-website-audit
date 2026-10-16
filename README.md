# Typewright Website Audit (MCP plugin)

A free audit for small and local business websites, by Typewright Studio (Michael McClanahan, Wilson, NC).
It runs 20 scored checks covering speed (Google PageSpeed Insights), mobile, Google findability, trust and contact, and accessibility basics. Each check comes with a plain-English finding and a cited source (Google, W3C WCAG 2.2, Nielsen Norman Group, Baymard Institute).

The score is always out of 20. A check that couldn't run counts as not passed, and the report says why.

## What's inside
- `server/typewright_audit_mcp.py`: an MCP server built on the official MCP Python SDK (v2) with stdio transport. It has one tool, `audit_website(url)`.
- `skills/present-website-audit/SKILL.md`: how an agent should present the report.
- `mcp.json`, `.cursor-plugin/plugin.json`: the plugin manifest.

## Configuration
| env var | default | purpose |
|---|---|---|
| `TYPEWRIGHT_AUDIT_ENDPOINT` | `https://typewrightstudio.com/api/audit` | audit API |
| `TYPEWRIGHT_AUDIT_INCLUDE_CTA` | `true` | `false` drops the one-line "Start a project" link |

## Run locally
```
uv run --with "mcp>=2,<3" python server/typewright_audit_mcp.py   # stdio server
uv run --with "mcp>=2,<3" python tests/test_client.py example.com   # real MCP client test
```

## Data and privacy
The plugin holds no keys and stores nothing. It sends the URL you give it to the Typewright audit API, which fetches the public site and asks Google PageSpeed Insights for speed results. Neither the URL nor the results are stored. Rate limiting keeps a salted hash of the caller's IP in memory for at most 24 hours.
- Privacy: https://typewrightstudio.com/privacy/
- Terms: https://typewrightstudio.com/terms/
- Publisher: Michael McClanahan, an individual doing business as Typewright Studio
- Support: Michael McClanahan, hello@typewrightstudio.com
- Audit data is not sold and is never used to train AI models.
- Not affiliated with or endorsed by Cursor.

## Security
The audit API blocks private, loopback and link-local addresses and re-checks every redirect. It's rate limited and has no secrets in this repo. To report a security issue, email hello@typewrightstudio.com.

## License
MIT © 2026 Michael McClanahan
