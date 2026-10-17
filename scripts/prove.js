#!/usr/bin/env node
"use strict";

/**
 * Local proof for the Typewright website audit plugin.
 * The default run talks only to a mock server on 127.0.0.1.
 * `node scripts/prove.js --live https://example.com` also calls the real audit once.
 */

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixture-report.json"), "utf8"));
const steps = [];

function record(name, ok, detail) {
  steps.push({ name, ok, detail: detail || "" });
  const line = `${ok ? "PASS" : "FAIL"}  ${name}`;
  if (detail && ok && !detail.includes("\n")) {
    process.stdout.write(`${line}  ${detail}\n`);
    return;
  }
  process.stdout.write(detail && !ok ? `${line}\n${detail}\n` : `${line}\n`);
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function liveUrlFromArgv(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--live") {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) return next;
      return "https://typewrightstudio.com";
    }
  }
  return "";
}

function checkManifest() {
  const manifest = JSON.parse(read(".cursor-plugin/plugin.json"));
  const nameOk = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(manifest.name);
  assert(nameOk, `plugin name ${manifest.name} is not kebab-case`);
  assert(manifest.name === "typewright-website-audit", "plugin name");
  assert(manifest.displayName === "Typewright Website Audit", "displayName");
  assert(manifest.license === "MIT", "license");
  assert(manifest.author && manifest.author.name === "Michael McClanahan", "author name");
  assert(manifest.author.email === "hello@typewrightstudio.com", "author email");
  assert(!Object.prototype.hasOwnProperty.call(manifest, "publisher"), "publisher is not a manifest field");
  assert(!Object.prototype.hasOwnProperty.call(manifest, "tags"), "tags is not a manifest field");
  assert(manifest.homepage === "https://typewrightstudio.com/audit/", "homepage");
  assert(manifest.logo === "assets/icon.svg", "logo path");
  assert(fs.existsSync(path.join(root, "assets/icon.svg")), "logo file");
  assert(manifest.skills === "./skills/", "skills path");
  assert(manifest.mcpServers === "./mcp.json", "mcpServers path");
  assert(!manifest.variables, "plugin must not declare secret variables");
  const listing = manifest.description;
  for (const bit of [
    "typewrightstudio.com",
    "Google PageSpeed",
    "https://typewrightstudio.com/privacy/",
    "https://typewrightstudio.com/terms/",
  ]) {
    assert(listing.includes(bit), `listing missing: ${bit}`);
  }

  const mcp = JSON.parse(read("mcp.json"));
  const server = mcp.mcpServers["typewright-website-audit"];
  assert(server && server.type === "stdio", "mcp type");
  assert(server.command === "node", "mcp command");
  assert(Array.isArray(server.args) && server.args.some((arg) => arg.includes("server/audit-mcp.js")), "mcp args");
  assert(server.args.some((arg) => arg.includes("${CURSOR_PLUGIN_ROOT}")), "CURSOR_PLUGIN_ROOT");
  assert(server.env && server.env.TYPEWRIGHT_AUDIT_ENDPOINT === "https://typewrightstudio.com/api/audit", "endpoint env");
  assert(!JSON.stringify(mcp).toLowerCase().includes("api_key"), "mcp api key");
  assert(!JSON.stringify(mcp).toLowerCase().includes("secret"), "mcp secret");
  assert(!JSON.stringify(mcp).includes("uv"), "mcp still uses uv");
  assert(!JSON.stringify(mcp).includes("python"), "mcp still uses python");

  const skill = read("skills/present-website-audit/SKILL.md");
  assert(skill.startsWith("---\n"), "skill frontmatter");
  assert(skill.includes("name: present-website-audit"), "skill name");
  assert(skill.includes("audit_website"), "skill tool");
  assert(skill.includes("structuredContent"), "skill structuredContent");
  assert(skill.includes("Do not recompute the counts"), "skill does no client-side math");
  assert(skill.includes("couldnt_check"), "skill couldn't-check");
  assert(skill.includes("Typewright heuristic"), "skill heuristic label");
  assert(skill.includes("cta.text"), "skill shows returned cta");
  assert(skill.includes("hello@typewrightstudio.com") || skill.includes("https://typewrightstudio.com/privacy/"), "skill privacy");
  assert(!skill.includes("uv "), "skill still mentions uv");

  const readme = read("README.md");
  assert(readme.includes("Node.js"), "README node requirement");
  assert(readme.includes("no npm install"), "README no npm");
  assert(readme.includes("no Python"), "README no Python");
  assert(readme.includes("node scripts/prove.js"), "README prove command");
  assert(readme.includes("exactly as the API returns them"), "README score line");
  assert(readme.includes("Do not recompute the counts."), "README does not recompute");
  assert(!readme.includes("uv run"), "README still uses uv");
  assert(!readme.includes("mcp>=2"), "README still uses the Python SDK");
  assert(readme.includes("Michael McClanahan"), "README publisher");
  assert(readme.includes("hello@typewrightstudio.com"), "README support");
  assert(readme.includes("never used to train AI models"), "README no-training");
  assert(readme.includes("Not affiliated with or endorsed by Cursor."), "README no-affiliation");
  assert(readme.includes("MIT"), "README license");
  assert(readme.includes("assets/icon.svg"), "README logo");

  const license = read("LICENSE");
  assert(license.startsWith("MIT License"), "LICENSE heading");
  assert(license.includes("Copyright (c) 2026 Michael McClanahan"), "LICENSE copyright");

  for (const bit of [
    "typewrightstudio.com",
    "Google PageSpeed",
    "Neither the URL nor the results are stored",
    "https://typewrightstudio.com/privacy/",
    "https://typewrightstudio.com/terms/",
    "never used to train AI models",
    "Not affiliated with or endorsed by Cursor.",
  ]) {
    assert(readme.includes(bit), `README missing: ${bit}`);
    assert(read("PRIVACY.md").includes(bit), `PRIVACY missing: ${bit}`);
  }
  assert(read("PRIVACY.md").includes("hello@typewrightstudio.com"), "PRIVACY support");

  const spec = read("SPEC.md");
  assert(spec.includes("source=plugin"), "SPEC query source");
  assert(spec.includes('"source": "plugin"'), "SPEC body source");
  assert(spec.includes('"score"'), "SPEC score");
  assert(spec.includes('"passed"'), "SPEC passed");
  assert(spec.includes('"total"'), "SPEC total");
  assert(spec.includes("needs_work"), "SPEC needs_work");
  assert(spec.includes("couldnt_check"), "SPEC couldnt_check");
  assert(spec.includes("bad_url"), "SPEC bad_url");
  assert(spec.includes("blocked"), "SPEC blocked");
  assert(spec.includes("https://typewrightstudio.com/privacy/"), "SPEC privacy");
  assert(spec.includes("https://typewrightstudio.com/terms/"), "SPEC terms");

  const serverSrc = read("server/audit-mcp.js");
  assert(serverSrc.includes('source: "plugin"'), "server body source");
  assert(serverSrc.includes('searchParams.set("source", "plugin")'), "server query source");
  assert(
    serverSrc.match(/require\("([^"]+)"\)/g).every((item) => {
      const name = item.slice(9, -2);
      return ["http", "https", "url"].includes(name);
    }),
    "server imports a non-builtin"
  );
  assert(!/PAGESPEED_API_KEY|API_KEY|TWILIO|Authorization\s*:|Bearer\s+/i.test(serverSrc), "server mentions a credential");
  assert(!/score\s*[+\-]=|passed\s*[+\-]=/.test(serverSrc), "server adjusts the score");
  assert(serverSrc.includes("structuredContent: validated.report"), "server returns structuredContent");
  assert(serverSrc.includes("TYPEWRIGHT_AUDIT_ENDPOINT"), "server reads the endpoint env");
  assert(!serverSrc.includes("uv "), "server mentions uv");
  assert(!fs.existsSync(path.join(root, "server/typewright_audit_mcp.py")), "python server still present");
  assert(!fs.existsSync(path.join(root, "tests/test_client.py")), "python tests still present");

  const bannedFiles = [
    "README.md",
    "PRIVACY.md",
    "SPEC.md",
    "LICENSE",
    ".cursor-plugin/plugin.json",
    "mcp.json",
    "server/audit-mcp.js",
    "skills/present-website-audit/SKILL.md",
  ];
  const combined = bannedFiles.map(read).join("\n");
  const bans = [
    [/Cursor AI/i, "Cursor AI"],
    [/Journey Digital/i, "Journey Digital"],
    [/journeydigital/i, "journeydigital"],
    [/Tabernacle/i, "Tabernacle"],
    [/\bArch\b/, "Arch"],
  ];
  for (const [pattern, label] of bans) {
    assert(!pattern.test(combined), `banned wording: ${label}`);
  }
  assert(!fs.existsSync(path.join(root, "package.json")), "package.json would add dependencies");
}

function syntaxCheck(rel) {
  const result = spawnSync(process.execPath, ["--check", rel], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${rel} failed node --check`);
  }
}

class Client {
  constructor(child, framing) {
    this.child = child;
    this.framing = framing || "ndjson";
    this.buf = Buffer.alloc(0);
    this.waiters = [];
    this.stderr = "";
    this.lastFraming = "";
    child.stdout.on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      this.drain();
    });
    child.stderr.on("data", (chunk) => {
      this.stderr += chunk.toString("utf8");
    });
    child.on("exit", (code) => {
      const err = new Error(`server exited ${code}: ${this.stderr}`);
      while (this.waiters.length) this.waiters.shift().reject(err);
    });
  }

  fail(err) {
    const waiter = this.waiters.shift();
    if (waiter) waiter.reject(err);
  }

  take() {
    if (this.buf[0] === 0x7b) {
      const nl = this.buf.indexOf(0x0a);
      if (nl === -1) return null;
      let line = this.buf.slice(0, nl);
      const rest = this.buf.slice(nl + 1);
      if (line.length && line[line.length - 1] === 0x0d) line = line.slice(0, -1);
      const raw = line.toString("utf8");
      return { framing: "ndjson", msg: JSON.parse(raw), rest, raw };
    }
    const sep = this.buf.indexOf("\r\n\r\n");
    if (sep === -1) return null;
    const header = this.buf.slice(0, sep).toString("utf8");
    const match = header.match(/content-length:\s*(\d+)/i);
    if (!match) throw new Error(`bad frame header: ${header}`);
    const length = Number(match[1]);
    const start = sep + 4;
    if (this.buf.length < start + length) return null;
    const raw = this.buf.slice(start, start + length).toString("utf8");
    return {
      framing: "content-length",
      msg: JSON.parse(raw),
      rest: this.buf.slice(start + length),
      raw,
    };
  }

  drain() {
    try {
      while (this.waiters.length && this.buf.length) {
        while (this.buf.length && (this.buf[0] === 0x0a || this.buf[0] === 0x0d)) {
          this.buf = this.buf.slice(1);
        }
        if (!this.buf.length) return;
        const taken = this.take();
        if (!taken) return;
        if (this.framing !== "auto" && taken.framing !== this.framing) {
          this.fail(new Error(`expected ${this.framing} framing, got ${taken.framing}`));
          return;
        }
        this.buf = taken.rest;
        this.lastFraming = taken.framing;
        this.waiters.shift().resolve(taken.msg);
      }
    } catch (err) {
      this.fail(err);
    }
  }

  write(obj, options) {
    const framing = (options && options.framing) || (this.framing === "auto" ? "ndjson" : this.framing);
    const pretty = Boolean(options && options.pretty);
    const json = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    if (framing === "content-length") {
      const body = Buffer.from(json, "utf8");
      this.child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
      this.child.stdin.write(body);
      return;
    }
    if (json.indexOf("\n") !== -1) throw new Error("newline-delimited message contains a newline");
    this.child.stdin.write(json + "\n");
  }

  request(obj, timeoutMs = 5000, options) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout waiting for ${obj.method}`)), timeoutMs);
      this.waiters.push({
        resolve: (msg) => {
          clearTimeout(timer);
          resolve(msg);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.write(obj, options);
    });
  }

  notify(obj, options) {
    this.write(obj, options);
  }

  close() {
    this.child.kill();
  }
}

function startClient(endpoint, extraEnv, framing) {
  const env = { ...process.env, ...(extraEnv || {}) };
  if (endpoint == null) delete env.TYPEWRIGHT_AUDIT_ENDPOINT;
  else env.TYPEWRIGHT_AUDIT_ENDPOINT = endpoint;
  const child = spawn(process.execPath, ["server/audit-mcp.js"], {
    cwd: root,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return new Client(child, framing || "ndjson");
}

function startClientFromMcpJson(endpoint) {
  const mcp = JSON.parse(read("mcp.json"));
  const spec = mcp.mcpServers["typewright-website-audit"];
  const pluginRoot = root;
  const subst = (value) => String(value).split("${CURSOR_PLUGIN_ROOT}").join(pluginRoot);
  const args = spec.args.map(subst);
  const cwd = subst(spec.cwd);
  const env = {
    ...process.env,
    ...(spec.env || {}),
    CURSOR_PLUGIN_ROOT: pluginRoot,
    TYPEWRIGHT_AUDIT_ENDPOINT: endpoint,
  };
  const child = spawn(spec.command, args, {
    cwd,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const client = new Client(child, "ndjson");
  client.launch = { command: spec.command, args, cwd };
  return client;
}

function toolText(response) {
  const result = response && response.result;
  assert(result, `missing result: ${JSON.stringify(response)}`);
  assert(Array.isArray(result.content) && result.content[0] && result.content[0].type === "text", "content");
  return result.content[0].text;
}

function assertNoReport(text) {
  assert(!text.includes('"verdict"'), `error leaked a verdict:\n${text}`);
  assert(!text.includes("UNIQUE_FINDING_SHOULD_NOT_LEAK"), `error leaked a finding:\n${text}`);
  assert(!text.includes("UNIQUE_VERDICT_SHOULD_NOT_LEAK"), `error leaked a finding:\n${text}`);
  assert(text.includes("No check results are shown.") || text.includes("no check results are shown."), text);
}

function listen(handler) {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function initialize(client) {
  const init = await client.request({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "prove", version: "0.0.0" },
    },
  });
  assert(init.result && init.result.protocolVersion === "2024-11-05", "protocol");
  client.notify({ jsonrpc: "2.0", method: "notifications/initialized" });
  return init;
}

async function main() {
  const liveUrl = liveUrlFromArgv(process.argv.slice(2));

  try {
    checkManifest();
    record("manifest", true);
  } catch (err) {
    record("manifest", false, err.stack || err.message);
  }

  for (const rel of ["server/audit-mcp.js", "scripts/prove.js"]) {
    try {
      syntaxCheck(rel);
      record(`node --check ${rel}`, true);
    } catch (err) {
      record(`node --check ${rel}`, false, err.message);
    }
  }

  const hits = [];
  const mock = await listen((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      hits.push({ method: req.method, url: req.url, headers: req.headers, body });
      let target = "";
      try {
        target = JSON.parse(body).url || "";
      } catch (_err) {
        target = "";
      }
      const send = (status, payload) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(payload));
      };
      if (target.endsWith("/bad")) {
        send(400, {
          error: "bad_url",
          message: "Please enter a website address, like example.com.",
        });
        return;
      }
      if (target.endsWith("/blocked")) {
        send(422, {
          error: "blocked",
          message: "That address points to a private or local network, so it can't be checked.",
        });
        return;
      }
      if (target.endsWith("/plain")) {
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end("upstream exploded");
        return;
      }
      if (target.endsWith("/malformed")) {
        const broken = JSON.parse(JSON.stringify(fixture));
        delete broken.checks[0].citations;
        broken.checks[0].finding = "UNIQUE_FINDING_SHOULD_NOT_LEAK";
        send(200, broken);
        return;
      }
      if (target.endsWith("/badverdict")) {
        const broken = JSON.parse(JSON.stringify(fixture));
        broken.checks[0].verdict = "needs work";
        broken.checks[0].finding = "UNIQUE_VERDICT_SHOULD_NOT_LEAK";
        send(200, broken);
        return;
      }
      if (target.endsWith("/asis")) {
        const payload = JSON.parse(JSON.stringify(fixture));
        const httpsCheck = payload.checks.find((item) => item.id === "https");
        httpsCheck.verdict = "couldnt_check";
        httpsCheck.finding = "We couldn't check HTTPS because the connection dropped.";
        payload.score = 9;
        payload.passed = 9;
        payload.total = 20;
        payload.couldnt = 2;
        payload.couldnt_check = 2;
        send(200, payload);
        return;
      }
      if (target.endsWith("/ok")) {
        const payload = JSON.parse(JSON.stringify(fixture));
        let include = true;
        try {
          if (JSON.parse(body).include_cta === false) include = false;
        } catch (_err) {
          include = true;
        }
        if (!include) delete payload.cta;
        send(200, payload);
        return;
      }
      send(500, { error: "audit_failed", message: "Unexpected mock target." });
    });
  });

  const endpoint = `http://127.0.0.1:${mock.address().port}/api/audit`;
  const client = startClient(endpoint, {
    PAGESPEED_API_KEY: "supersecret-should-not-leak",
    AUDIT_API_KEY: "another-secret",
  });

  let sample = "";
  try {
    const init = await initialize(client);
    assert(init.result.serverInfo.name === "typewright-website-audit", "server name");
    assert(init.result.capabilities && init.result.capabilities.tools, "tools capability");
    assert(client.lastFraming === "ndjson", "initialize response is newline-delimited");
    record("initialize", true);
  } catch (err) {
    record("initialize", false, `${err.message}\n${client.stderr}`);
  }

  try {
    const listed = await client.request({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = listed.result && listed.result.tools;
    assert(Array.isArray(tools) && tools.length === 1, "expected one tool");
    assert(tools[0].name === "audit_website", "tool name");
    assert(deepEqual(tools[0].inputSchema.required, ["url"]), "url required");
    assert(!tools[0].inputSchema.properties.include_cta, "include_cta is not a tool argument");
    assert(client.lastFraming === "ndjson", "tools/list is newline-delimited");
    record("tools/list", true, tools[0].name);
  } catch (err) {
    record("tools/list", false, `${err.message}\n${client.stderr}`);
  }

  try {
    const before = hits.length;
    const call = await client.request({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "https://example.com/ok" } },
    });
    const text = toolText(call);
    assert(call.result.isError === false, "isError should be false");
    const report = JSON.parse(text);
    assert(deepEqual(report, fixture), `report was rewritten:\n${text}`);
    assert(deepEqual(call.result.structuredContent, report), "structuredContent matches text");
    assert(report.score === 14 && report.passed === 14 && report.total === 20, "fixture score was recomputed");
    const hit = hits[hits.length - 1];
    assert(hits.length === before + 1, "mock was not called once");
    assert(hit.method === "POST", "method");
    assert(hit.url === "/api/audit?source=plugin", `path ${hit.url}`);
    assert(
      deepEqual(JSON.parse(hit.body), {
        url: "https://example.com/ok",
        source: "plugin",
        include_cta: true,
      }),
      `body ${hit.body}`
    );
    assert(!hit.headers.authorization, "authorization header");
    const raw = `${hit.url}\n${hit.body}\n${JSON.stringify(hit.headers)}`;
    assert(!raw.includes("supersecret-should-not-leak"), "PAGESPEED key leaked");
    assert(!raw.includes("another-secret"), "AUDIT key leaked");
    sample = text;
    record("tools/call fixture", true, `score ${report.score}, passed ${report.passed}/${report.total}`);
  } catch (err) {
    record("tools/call fixture", false, `${err.message}\n${client.stderr}`);
  }

  const noCta = startClient(endpoint, { TYPEWRIGHT_AUDIT_INCLUDE_CTA: "false" });
  try {
    await initialize(noCta);
    const before = hits.length;
    const call = await noCta.request({
      jsonrpc: "2.0",
      id: "nocta",
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "https://example.com/ok" } },
    });
    const text = toolText(call);
    assert(call.result.isError === false, "isError should be false");
    const report = JSON.parse(text);
    assert(deepEqual(call.result.structuredContent, report), "structuredContent matches text");
    assert(!Object.prototype.hasOwnProperty.call(report, "cta"), "cta must be absent");
    assert(report.score === fixture.score && report.passed === fixture.passed && report.total === fixture.total, "score changed");
    const hit = hits[hits.length - 1];
    assert(hits.length === before + 1, "mock call");
    assert(
      deepEqual(JSON.parse(hit.body), {
        url: "https://example.com/ok",
        source: "plugin",
        include_cta: false,
      }),
      `body ${hit.body}`
    );
    record("include_cta false drops cta", true);
  } catch (err) {
    record("include_cta false drops cta", false, `${err.message}\n${noCta.stderr}`);
  }
  noCta.close();

  try {
    const call = await client.request({
      jsonrpc: "2.0",
      id: "asis",
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "https://example.com/asis" } },
    });
    const text = toolText(call);
    assert(call.result.isError === false, "isError should be false");
    const report = JSON.parse(text);
    const httpsCheck = report.checks.find((item) => item.id === "https");
    assert(httpsCheck.verdict === "couldnt_check", "couldn't-run verdict");
    assert(httpsCheck.finding === "We couldn't check HTTPS because the connection dropped.", "finding");
    assert(report.score === 9 && report.passed === 9 && report.total === 20, "counts were recomputed");
    assert(report.couldnt === 2 && report.couldnt_check === 2, "couldnt counts were recomputed");
    assert(deepEqual(call.result.structuredContent, report), "structuredContent matches text");
    record("score, passed, and total pass through", true, `${report.score} (${report.passed}/${report.total})`);
  } catch (err) {
    record("score, passed, and total pass through", false, `${err.message}\n${client.stderr}`);
  }

  async function expectClosed(name, url, includes) {
    try {
      const call = await client.request({
        jsonrpc: "2.0",
        id: name,
        method: "tools/call",
        params: { name: "audit_website", arguments: { url } },
      });
      const text = toolText(call);
      assert(call.result.isError === true, "isError should be true");
      assert(call.result.structuredContent == null, "error has no structuredContent");
      assertNoReport(text);
      for (const bit of includes) assert(text.includes(bit), `missing "${bit}" in:\n${text}`);
      record(name, true);
    } catch (err) {
      record(name, false, err.message);
    }
  }

  await expectClosed("fail-closed 400 bad URL", "https://example.com/bad", [
    "bad_url",
    "Please enter a website address, like example.com.",
  ]);
  await expectClosed("fail-closed 422 blocked address", "https://example.com/blocked", [
    "blocked",
    "That address points to a private or local network, so it can't be checked.",
  ]);
  await expectClosed("fail-closed non-JSON error", "https://example.com/plain", [
    "HTTP 502",
    "without a usable error message",
  ]);
  await expectClosed("fail-closed malformed report", "https://example.com/malformed", [
    "does not match the report format",
  ]);
  await expectClosed("fail-closed non-SPEC verdict", "https://example.com/badverdict", [
    "does not match the report format",
  ]);

  try {
    const before = hits.length;
    const call = await client.request({
      jsonrpc: "2.0",
      id: "blank",
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "   " } },
    });
    const text = toolText(call);
    assert(call.result.isError === true, "blank url should error");
    assert(call.result.structuredContent == null, "error has no structuredContent");
    assertNoReport(text);
    assert(hits.length === before, "blank url must not call the service");
    record("fail-closed blank url", true);
  } catch (err) {
    record("fail-closed blank url", false, err.message);
  }

  client.close();

  const badEndpoint = startClient("not a url");
  try {
    const before = hits.length;
    await initialize(badEndpoint);
    const call = await badEndpoint.request({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "https://example.com/ok" } },
    });
    const text = toolText(call);
    assert(call.result.isError === true, "bad endpoint should error");
    assert(call.result.structuredContent == null, "error has no structuredContent");
    assertNoReport(text);
    assert(text.includes("not a valid URL"), text);
    assert(hits.length === before, "bad endpoint must not call the service");
    record("fail-closed bad endpoint", true);
  } catch (err) {
    record("fail-closed bad endpoint", false, `${err.message}\n${badEndpoint.stderr}`);
  }
  badEndpoint.close();

  const down = startClient("http://127.0.0.1:9/api/audit");
  try {
    await initialize(down);
    const call = await down.request({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "https://example.com/ok" } },
    });
    const text = toolText(call);
    assert(call.result.isError === true, "unreachable should error");
    assert(call.result.structuredContent == null, "error has no structuredContent");
    assertNoReport(text);
    assert(/could not be reached/i.test(text), text);
    assert(!text.includes("example.com/ok"), "unreachable must not invent the fixture");
    record("fail-closed unreachable", true);
  } catch (err) {
    record("fail-closed unreachable", false, `${err.message}\n${down.stderr}`);
  }
  down.close();

  const framed = startClient(endpoint, {}, "content-length");
  try {
    const init = await framed.request(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "prove", version: "0.0.0" },
        },
      },
      5000,
      { pretty: true }
    );
    assert(init.result && init.result.serverInfo.name === "typewright-website-audit", "content-length init");
    assert(framed.lastFraming === "content-length", "content-length response framing");
    framed.notify({ jsonrpc: "2.0", method: "notifications/initialized" }, { pretty: true });
    const listed = await framed.request({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    assert(listed.result.tools[0].name === "audit_website", "content-length tools/list");
    assert(framed.lastFraming === "content-length", "content-length list framing");
    const call = await framed.request({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "audit_website", arguments: { url: "https://example.com/ok" } },
    });
    const report = JSON.parse(toolText(call));
    assert(deepEqual(report, fixture), "content-length report");
    assert(deepEqual(call.result.structuredContent, report), "content-length structuredContent");
    record("content-length framing", true);
  } catch (err) {
    record("content-length framing", false, `${err.message}\n${framed.stderr}`);
  }
  framed.close();

  const mixed = startClient(endpoint, {}, "auto");
  try {
    const init = await mixed.request(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "prove", version: "0.0.0" },
        },
      },
      5000,
      { framing: "content-length" }
    );
    assert(init.result && init.result.protocolVersion === "2024-11-05", "mixed init");
    assert(mixed.lastFraming === "content-length", "first response follows content-length");
    const listed = await mixed.request({ jsonrpc: "2.0", id: 2, method: "tools/list" }, 5000, { framing: "ndjson" });
    assert(listed.result.tools[0].name === "audit_website", "mixed tools/list");
    assert(mixed.lastFraming === "ndjson", "second response follows newline-delimited");
    record("framing auto-detect per message", true);
  } catch (err) {
    record("framing auto-detect per message", false, `${err.message}\n${mixed.stderr}`);
  }
  mixed.close();

  const launched = startClientFromMcpJson(endpoint);
  try {
    assert(launched.launch.command === "node", "mcp command");
    assert(launched.launch.cwd === root, "mcp cwd");
    assert(
      launched.launch.args.length === 1 && launched.launch.args[0] === path.join(root, "server/audit-mcp.js"),
      `mcp args ${launched.launch.args.join(" ")}`
    );
    const init = await launched.request({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "prove", version: "0.0.0" },
      },
    });
    assert(init.result && init.result.protocolVersion === "2024-11-05", "mcp.json protocol");
    assert(launched.lastFraming === "ndjson", "mcp.json spawn speaks newline-delimited JSON");
    launched.notify({ jsonrpc: "2.0", method: "notifications/initialized" });
    const listed = await launched.request({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    assert(listed.result.tools[0].name === "audit_website", "mcp.json tools/list");
    record("spawn as mcp.json", true);
  } catch (err) {
    record("spawn as mcp.json", false, `${err.message}\n${launched.stderr}`);
  }
  launched.close();
  mock.close();

  if (liveUrl) {
    const live = startClient("https://typewrightstudio.com/api/audit");
    try {
      await initialize(live);
      const call = await live.request(
        {
          jsonrpc: "2.0",
          id: "live",
          method: "tools/call",
          params: { name: "audit_website", arguments: { url: liveUrl } },
        },
        120000
      );
      const text = toolText(call);
      assert(call.result.isError === false, `live error:\n${text}`);
      const report = JSON.parse(text);
      assert(deepEqual(call.result.structuredContent, report), "live structuredContent matches text");
      assert(Number.isInteger(report.score) && Number.isInteger(report.passed) && Number.isInteger(report.total), "live counts");
      assert(report.passed <= report.total, "live passed/total");
      assert(Array.isArray(report.checks) && report.checks.length > 0, "live checks");
      assert(typeof report.scoring === "string" && report.scoring.length > 0, "live scoring sentence");
      record(
        `live ${liveUrl}`,
        true,
        `score ${report.score}, passed ${report.passed}/${report.total}, couldnt ${report.couldnt}, checks ${report.checks.length}`
      );
    } catch (err) {
      record(`live ${liveUrl}`, false, `${err.message}\n${live.stderr}`);
    }
    live.close();
  }

  const failed = steps.filter((step) => !step.ok).length;
  process.stdout.write(`\n${steps.length - failed}/${steps.length} passed\n`);
  if (sample) {
    process.stdout.write("\n----- sample tools/call text -----\n");
    process.stdout.write(sample);
    process.stdout.write("\n----- end sample -----\n");
  }
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
