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

// Copy template markdown files to dist
async function copyTemplateDir(srcDir, distDir) {
    try {
        await fs.mkdir(distDir, { recursive: true });
        const files = await fs.readdir(srcDir);
        for (const file of files) {
            const srcPath = path.join(srcDir, file);
            const distPath = path.join(distDir, file);
            const stat = await fs.stat(srcPath);
            if (stat.isDirectory()) {
                await copyTemplateDir(srcPath, distPath);
            } else if (file.endsWith(".md") || file.endsWith(".mdc")) {
                await fs.copyFile(srcPath, distPath);
            }
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`postbuild: could not copy ${srcDir}: ${msg}\n`);
        process.exit(1);
    }
}

// Copy all template directories
const templateDirs = ["defaultPrompts", "agentRules", "projectContext", "setup", "scaffolds"];
for (const dir of templateDirs) {
    const srcDir = path.resolve(`src/templates/${dir}`);
    const distDir = path.resolve(`dist/templates/${dir}`);
    await copyTemplateDir(srcDir, distDir);
}
