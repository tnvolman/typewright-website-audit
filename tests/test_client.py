"""Real MCP client test: spawns the server over stdio with the official SDK client,
lists tools, and calls audit_website. Usage: python tests/test_client.py [url]"""
import asyncio
import os
import sys

from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

HERE = os.path.dirname(os.path.abspath(__file__))


async def main(url):
    params = StdioServerParameters(command=sys.executable,
                                   args=[os.path.join(HERE, "..", "server", "typewright_audit_mcp.py")],
                                   env=dict(os.environ))
    async with stdio_client(params) as (r, w):
        async with ClientSession(r, w) as s:
            init = await s.initialize()
            print("server:", init.server_info.name, init.server_info.version)
            tools = await s.list_tools()
            names = [t.name for t in tools.tools]
            print("tools:", names)
            assert names == ["audit_website"], names
            res = await s.call_tool("audit_website", {"url": url}, read_timeout_seconds=90)
            text = res.content[0].text
            print(text)
            assert not res.is_error
            assert "/ 20" in text or text.startswith("Audit failed"), text[:200]


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "typewrightstudio.com"))
