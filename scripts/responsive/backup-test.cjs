const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(file) {
  const mod = { exports: {} };
  const out = ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function("require", "module", "exports", out)(require, mod, mod.exports);
  return mod.exports;
}
const lib = load("src/lib/backups.ts");

test("backup names map to their São Paulo timestamp and reject anything else", () => {
  assert.equal(lib.backupTakenAt("softshake-2026-11-03_2330.tar.gz"), "2026-11-04T02:30:00.000Z");
  for (const bad of ["../softshake-2026-11-03_2330.tar.gz", "softshake-2026-11-03_2330.tar.gz/../x", "outro.tar.gz", "softshake-2026-13-40_9999.tar.gz", "", null])
    assert.equal(lib.isBackupName(bad), false, String(bad));
});

test("health flags a missing daily backup after 26 hours", () => {
  const items = [{ name: "a", size: 1, takenAt: "2026-11-04T02:30:00.000Z" }];
  assert.equal(lib.backupHealth([], Date.now()), "empty");
  assert.equal(lib.backupHealth(items, Date.parse("2026-11-05T02:00:00Z")), "ok");
  assert.equal(lib.backupHealth(items, Date.parse("2026-11-05T05:00:00Z")), "stale");
  assert.equal(lib.formatBytes(1536), "1,5 KB");
});

test("workflow runs at 23:30 Brasília and never publishes the dump on GitHub", () => {
  const yml = fs.readFileSync(".github/workflows/supabase-backup.yml", "utf8");
  assert.match(yml, /cron: "30 2 \* \* \*"/);
  assert.doesNotMatch(yml, /upload-artifact|gh release|actions\/cache/, "public repo: dump must not leave Supabase private storage");
  assert.match(yml, /"public":false/);
});

test("backup actions require the administrator permission", () => {
  const src = fs.readFileSync("src/actions/admin/backups.ts", "utf8");
  assert.equal((src.match(/requirePermission\("admin:manage"\)/g) || []).length, 2);
  assert.match(src, /isBackupName\(name\)/);
  assert.match(src, /createSignedUrl\(name, 60/);
});
