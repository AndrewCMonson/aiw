import fs from "node:fs/promises";
import path from "node:path";

const cliPath = path.resolve("dist/cli.js");
const shebang = "#!/usr/bin/env node\n";

let contents;
try {
  contents = await fs.readFile(cliPath, "utf8");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`postbuild: could not read ${cliPath}: ${msg}\n`);
  process.exit(1);
}

if (!contents.startsWith("#!")) {
  await fs.writeFile(cliPath, shebang + contents, "utf8");
}

// Best-effort: make executable on POSIX.
try {
  await fs.chmod(cliPath, 0o755);
} catch {
  // ignore (e.g., Windows)
}

