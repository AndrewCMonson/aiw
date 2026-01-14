import fs from "node:fs/promises";
import path from "node:path";
export async function mkdirp(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}
function timestampForBackup() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}
async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function safeWriteFile(filePath, contents, opts) {
    await mkdirp(path.dirname(filePath));
    if (!(await pathExists(filePath))) {
        await fs.writeFile(filePath, contents, "utf8");
        return { action: "created", path: filePath };
    }
    if (!opts.force) {
        return { action: "skipped", path: filePath };
    }
    const backupPath = `${filePath}.bak.${timestampForBackup()}`;
    await fs.copyFile(filePath, backupPath);
    await fs.writeFile(filePath, contents, "utf8");
    return { action: "overwritten", path: filePath, backupPath };
}
export async function readTextFile(filePath) {
    return fs.readFile(filePath, "utf8");
}
