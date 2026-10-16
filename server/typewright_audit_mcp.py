"""Typewright Website Audit: MCP server (stdio).

Built on the official MCP Python SDK. Exposes one tool, `audit_website`, which
sends a URL to the Typewright audit API and returns the report unchanged.

Config (environment variables):
  TYPEWRIGHT_AUDIT_ENDPOINT   audit API URL (default: see DEFAULT_ENDPOINT)
  TYPEWRIGHT_AUDIT_INCLUDE_CTA  "false" to drop the one-line call to action
  VERCEL_PROTECTION_BYPASS    optional, only for testing a protected preview
"""
import json
import os
import urllib.error
import urllib.request

from mcp.server.mcpserver import MCPServer

# Preview deployment for now; switch to https://typewrightstudio.com/api/audit at launch.
DEFAULT_ENDPOINT = "https://typewrightstudio-com-git-feature-website-audit-freeborn.vercel.app/api/audit"
VERSION = "0.1.0"
TIMEOUT = 75

mcp = MCPServer(
    name="typewright-website-audit",
    title="Typewright Website Audit",
    version=VERSION,
    instructions=("Free website audit for small and local businesses by Typewright Studio. "
                  "Call audit_website with a site the user owns or may test. Report the verdicts as returned; "
                  "do not change them. Score is out of 20; a check that couldn't run counts as not passed."),
    website_url="https://typewrightstudio.com/audit/",
)


def endpoint():
    return os.environ.get("TYPEWRIGHT_AUDIT_ENDPOINT", "").strip() or DEFAULT_ENDPOINT


def call_api(url, include_cta):
    body = json.dumps({"url": url, "include_cta": include_cta}).encode()
    headers = {"Content-Type": "application/json", "User-Agent": f"typewright-website-audit-mcp/{VERSION}"}
    bypass = os.environ.get("VERCEL_PROTECTION_BYPASS", "").strip()
    if bypass:
        headers["x-vercel-protection-bypass"] = bypass
    req = urllib.request.Request(endpoint(), data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode("utf-8"))
        except Exception:
            data = {}
        return {"error": data.get("error", f"http_{e.code}"),
                "message": data.get("message", f"The audit service answered HTTP {e.code}.")}
    except Exception as e:
        return {"error": "unreachable", "message": f"Couldn't reach the audit service ({e.__class__.__name__})."}


def render(report):
    """Plain-text rendering. Verdicts and wording are passed through unchanged."""
    if "error" in report:
        return f"Audit failed: {report['message']}"
    names = {"pass": "PASS", "needs_work": "NEEDS WORK", "couldnt_check": "COULDN'T CHECK", "info": "NOTE"}
    by = {c["id"]: c for c in report["checks"]}
    lines = [f"Website audit for {report.get('final_url') or report['url']}",
             f"Score: {report['passed']} / {report['total']}"
             + (f" ({report['couldnt']} couldn't be checked and count as not passed)" if report.get("couldnt") else ""),
             ""]
    for g in report["groups"]:
        lines.append(f"## {g['name']}")
        for cid in g["ids"]:
            c = by.get(cid)
            if not c:
                continue
            src = "; ".join(f"{s['name']} <{s['url']}>" for s in c.get("citations", []))
            lines.append(f"- [{names.get(c['verdict'], c['verdict'])}] {c['label']}: {c['finding']}")
            lines.append(f"  Source: {src}")
        lines.append("")
    lines.append(report.get("disclaimer", ""))
    if report.get("cta"):
        lines.append(f"{report['cta']['text']}: {report['cta']['url']}")
    return "\n".join(lines).strip()


@mcp.tool(
    title="Audit a business website",
    description=("Run Typewright's free 20-check audit on a public business website: speed (Google PageSpeed), "
                 "mobile, Google findability, trust and contact, and accessibility basics. Each check has a "
                 "plain-English finding and a cited source. Only audit sites the user owns or may test."),
)
def audit_website(url: str) -> str:
    """Audit one public website URL, for example "example.com"."""
    include_cta = os.environ.get("TYPEWRIGHT_AUDIT_INCLUDE_CTA", "true").lower() not in ("false", "0", "no")
    return render(call_api(url, include_cta))


def main():
    mcp.run("stdio")


if __name__ == "__main__":
    main()
