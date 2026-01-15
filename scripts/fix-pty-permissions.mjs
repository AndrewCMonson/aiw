#!/usr/bin/env node
/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 *
 * Fixes node-pty spawn-helper permissions on macOS/Linux.
 * The prebuild binaries sometimes lose execute permissions during npm install.
 */

import { chmod, access, constants } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const helpers = [
    "node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper",
    "node_modules/node-pty/prebuilds/darwin-x64/spawn-helper",
];

async function fixPermissions() {
    // Skip on Windows - no spawn-helper needed
    if (process.platform === "win32") {
        return;
    }

    for (const helper of helpers) {
        const fullPath = join(rootDir, helper);
        try {
            await access(fullPath, constants.F_OK);
            await chmod(fullPath, 0o755);
        } catch {
            // File doesn't exist (different platform), skip silently
        }
    }
}

fixPermissions().catch(() => {
    // Ignore errors - this is a best-effort fix
});
