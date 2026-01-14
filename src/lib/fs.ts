import fs from "node:fs/promises";
import path from "node:path";

export type SafeWriteResult =
  | { action: "created"; path: string }
  | { action: "skipped"; path: string }
  | { action: "overwritten"; path: string; backupPath: string };

export async function mkdirp(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

function timestampForBackup(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function safeWriteFile(
  filePath: string,
  contents: string,
  opts: { force: boolean }
): Promise<SafeWriteResult> {
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

export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

