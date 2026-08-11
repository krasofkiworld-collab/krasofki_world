#!/usr/bin/env node
// PostToolUse hook: after editing a .ts/.tsx file, run tsc --noEmit and
// surface only new errors as context for Claude. Advisory only — this
// event can't block the edit, it just saves a manual `tsc --noEmit` pass.
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    process.exit(0);
  }

  const filePath = input?.tool_input?.file_path ?? "";
  if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);

  const projectRoot = path.resolve(__dirname, "..", "..");
  // Invoke the local tsc binary directly with execFileSync (no shell) —
  // execSync's default shell is cmd.exe on Windows, which isn't reliably
  // resolvable from every process context this hook can run under.
  const tscBin = path.join(projectRoot, "node_modules", "typescript", "bin", "tsc");
  try {
    execFileSync(process.execPath, [tscBin, "--noEmit"], { cwd: projectRoot, timeout: 60_000 });
    process.exit(0); // clean — stay silent, don't add noise on every keystroke
  } catch (err) {
    const output = (err.stdout?.toString() ?? "") + (err.stderr?.toString() ?? "");
    // Known stale-cache artifact from LayoutProps typegen — see plans/00-overview.md history.
    const errors = output
      .split("\n")
      .filter((line) => line && !line.includes("LayoutProps") && !line.includes("validator.ts"))
      .slice(0, 30)
      .join("\n");
    if (errors.trim()) {
      console.error(`tsc --noEmit found issues after editing ${path.basename(filePath)}:\n${errors}`);
    }
    process.exit(0); // advisory — never block on this
  }
});
