/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

/**
 * Cursor Agent CLI wrapper for programmatic prompt execution.
 */

import { spawn } from "node:child_process";

export interface RunCursorAgentOptions {
    /** If true, runs in print mode (-p) for non-interactive output */
    print?: boolean;
    /** Output format: "text" or "json" */
    outputFormat?: "text" | "json";
    /** If true, fully inherits stdio for interactive use (no output capture) */
    interactive?: boolean;
    /** Delay in seconds before sending prompt (default: 1) */
    promptDelay?: number;
    /** Model to use (e.g., gpt-5, sonnet-4, sonnet-4-thinking) */
    model?: string;
}

export interface RunCursorAgentResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

/**
 * Escapes a string for use in an expect script.
 * Handles double quotes and backslashes.
 * @param str
 */
function escapeForExpect(str: string): string {
    return str
        .replace(/\\/g, "\\\\") // Escape backslashes first
        .replace(/"/g, '\\"') // Escape double quotes
        .replace(/\$/g, "\\$") // Escape dollar signs
        .replace(/\[/g, "\\[") // Escape brackets
        .replace(/\]/g, "\\]");
}

/**
 * Builds an expect script for running cursor agent with a prompt.
 *
 * Cursor agent requires a TTY, so we use `expect` to provide a pseudo-terminal.
 * The prompt is pasted into the input field and the user presses Enter to submit.
 * @param prompt
 * @param options
 */
function buildExpectScript(prompt: string, options: RunCursorAgentOptions): string {
    const delay = options.promptDelay ?? 1;
    const escapedPrompt = escapeForExpect(prompt);

    // Build cursor agent command with flags
    let cursorCmd = "cursor agent";
    if (options.model) {
        cursorCmd += ` --model ${options.model}`;
    }
    if (options.print) {
        cursorCmd += " -p";
        if (options.outputFormat) {
            cursorCmd += ` --output-format ${options.outputFormat}`;
        }
    }

    if (options.interactive) {
        // Interactive: send prompt, then hand control to user to review and submit
        return `
spawn ${cursorCmd}
sleep ${delay}
send "${escapedPrompt}"
interact
`;
    } else {
        // Non-interactive: send prompt and wait (user will need to submit manually or use -i)
        return `
set timeout -1
spawn ${cursorCmd}
sleep ${delay}
send "${escapedPrompt}"
expect eof
`;
    }
}

/**
 * Runs the Cursor Agent CLI with the given prompt.
 *
 * Uses `expect` to handle the TTY requirement of cursor agent.
 * The prompt is pasted into the input field after the agent initializes.
 * In interactive mode (-i), press Enter to submit and continue interacting.
 *
 * @param prompt - The prompt to send to the agent
 * @param options - Optional configuration for print mode and output format
 * @returns Promise resolving with stdout, stderr, and exit code
 * @throws Error if `expect` is not found in PATH
 */
export function runCursorAgent(prompt: string, options: RunCursorAgentOptions = {}): Promise<RunCursorAgentResult> {
    return new Promise((resolve, reject) => {
        const expectScript = buildExpectScript(prompt, options);

        let stdout = "";
        let stderr = "";

        const handleError = (err: NodeJS.ErrnoException): void => {
            if (err.code === "ENOENT") {
                reject(
                    new Error(
                        "The 'expect' command was not found in PATH. " +
                            "On macOS, expect is included by default. " +
                            "On Linux, install it with: apt install expect",
                    ),
                );
            } else {
                reject(new Error(`Failed to spawn expect: ${err.message}`));
            }
        };

        const handleClose = (code: number | null): void => {
            const exitCode = code ?? 1;
            resolve({ stdout, stderr, exitCode });
        };

        if (options.interactive) {
            // Interactive mode: inherit stdio for full terminal interaction
            const child = spawn("expect", ["-c", expectScript], {
                stdio: "inherit",
                shell: false,
            });

            child.on("error", handleError);
            child.on("close", handleClose);
        } else {
            // Non-interactive: capture output while streaming
            const child = spawn("expect", ["-c", expectScript], {
                stdio: ["inherit", "pipe", "pipe"],
                shell: false,
            });

            child.stdout.on("data", (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;
                process.stdout.write(chunk);
            });

            child.stderr.on("data", (data: Buffer) => {
                const chunk = data.toString();
                stderr += chunk;
                process.stderr.write(chunk);
            });

            child.on("error", handleError);
            child.on("close", handleClose);
        }
    });
}
