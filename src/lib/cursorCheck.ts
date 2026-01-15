/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { spawnSync } from "node:child_process";

export interface CursorCLICheckResult {
    available: boolean;
    error?: string;
}

/**
 * Checks if the Cursor CLI command is available in PATH.
 *
 * @returns Object indicating if cursor CLI is available and optional error message
 */
export function checkCursorCLI(): CursorCLICheckResult {
    // Try to run `cursor --version` to check if the command exists
    const res = spawnSync("cursor", ["--version"], {
        stdio: "ignore",
        shell: false,
    });

    if (res.error) {
        // ENOENT means the command was not found
        if (res.error.code === "ENOENT") {
            return {
                available: false,
                error: "The 'cursor' command was not found in PATH.",
            };
        }
        return {
            available: false,
            error: res.error.message,
        };
    }

    // If exit code is 0, cursor CLI is available
    if (res.status === 0) {
        return { available: true };
    }

    // Non-zero exit code might indicate cursor is installed but had an error
    // We'll still consider it "available" since the command exists
    return { available: true };
}
