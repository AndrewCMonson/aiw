import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
export async function makeTempDir(prefix = "aiw-test-") {
    return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}
