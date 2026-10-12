import test from "node:test";
import assert from "node:assert/strict";
const response = (
  body = "<html><body>Test</body></html>",
  status = 200,
  url = "https://example.com/",
  headers = {},
) => ({
  ok: true,
  result: {
    url,
    status,
    headers: { "content-type": "text/html", ...headers },
    body,
    bytes: Buffer.byteLength(body),
    cookies: [],
    chain: [{ url, status }],
  },
});
import { auditSite } from "../src/audit.js";
test("version mismatch, missing version and HTTP failure have honest status", async () => {
  const a = await auditSite("example.com", {
    expectedVersion: "new",
    fetcher: async () =>
      response("", 200, "https://example.com/", { "x-app-version": "old" }),
  });
  assert.ok(a.bulgular.some((f) => f.kod === "UP-VERSION"));
  const b = await auditSite("example.com", {
    expectedVersion: "new",
    fetcher: async () => response(),
  });
  assert.equal(b.bulgular.length, 0);
  assert.ok(b.bolumler[0].satirlar.some((r) => r.deger === "Yapılamadı"));
  const c = await auditSite("example.com", {
    fetcher: async () => response("", 503),
  });
  assert.ok(c.bulgular.some((f) => f.kod === "UP-STATUS"));
});
test("unreachable site is a report, not loss of monitoring history", async () => {
  const r = await auditSite("example.com", {
    fetcher: async () => ({ ok: false, error: "TLS failed" }),
  });
  assert.ok(r.bulgular.some((f) => f.kod === "UP-UNREACHABLE"));
  assert.equal(r.ozet.incelenenSayfa, 0);
});
