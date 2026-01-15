/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

/**
 * Cursor Agent CLI wrapper for programmatic prompt execution.
 * Uses node-pty for cross-platform pseudo-terminal support.
 */

import * as pty from "node-pty";

/**
 * List of supported model names for the Cursor Agent CLI.
 * Based on models available in Cursor as documented in README.md.
 */
export const SUPPORTED_MODELS = [
    "auto",
    "opus-4.5-thinking",
    "opus-4.5",
    "sonnet-4.5",
    "sonnet-4.5-thinking",
    "gpt-5.2",
    "gemini-3-pro",
    "gemini-3-flash",
] as const;

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
 * Calculates a simple similarity score between two strings.
 * Returns a value between 0 and 1, where 1 is identical.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
        return 1.0;
    }

    // Count matching characters
    let matches = 0;
    const longerLower = longer.toLowerCase();
    const shorterLower = shorter.toLowerCase();

    for (let i = 0; i < shorter.length; i++) {
        if (longerLower.includes(shorterLower[i])) {
            matches++;
        }
    }

    return matches / longer.length;
}

/**
 * Finds the closest matching model name from the supported list.
 * Handles common typos like missing hyphens, wrong separators, and case differences.
 *
 * @param model - The model name to find a match for
 * @returns The closest matching model name, or null if no close match is found
 */
export function findClosestModel(model: string): string | null {
    const modelLower = model.toLowerCase();

    // First, check for exact case-insensitive match
    for (const supported of SUPPORTED_MODELS) {
        if (supported.toLowerCase() === modelLower) {
            return supported;
        }
    }

    // Check for common typos: missing hyphens
    // e.g., "opus4.5" -> "opus-4.5"
    for (const supported of SUPPORTED_MODELS) {
        const normalizedSupported = supported.replace(/-/g, "");
        const normalizedModel = model.replace(/-/g, "").replace(/_/g, "");
        if (normalizedSupported.toLowerCase() === normalizedModel.toLowerCase()) {
            return supported;
        }
    }

    // Check for wrong separators (underscore instead of hyphen)
    // e.g., "opus_4.5" -> "opus-4.5"
    for (const supported of SUPPORTED_MODELS) {
        const normalizedSupported = supported.replace(/-/g, "_");
        if (normalizedSupported.toLowerCase() === modelLower) {
            return supported;
        }
    }

    // Use similarity matching for other typos
    let bestMatch: string | null = null;
    let bestScore = 0.7; // Minimum similarity threshold

    for (const supported of SUPPORTED_MODELS) {
        const score = calculateSimilarity(modelLower, supported.toLowerCase());
        if (score > bestScore) {
            bestScore = score;
            bestMatch = supported;
        }
    }

    return bestMatch;
}

/**
 * Validates a model name to prevent command injection.
 * Only allows alphanumeric characters, dots, hyphens, and underscores.
 *
 * @param model - The model name to validate
 * @returns The validated model name
 * @throws Error if the model name contains invalid characters
 */
export function validateModelName(model: string): string {
    const sanitized = model.replace(/[^a-zA-Z0-9._-]/g, "");
    if (sanitized !== model) {
        throw new Error(`Invalid model name: ${model}. Only alphanumeric characters, dots, hyphens, and underscores are allowed.`);
    }
    return sanitized;
}

/**
 * Validates that a model name is recognized from the supported list.
 * First performs security validation, then checks if the model is supported.
 * Provides helpful suggestions when an unrecognized model is provided.
 *
 * @param model - The model name to validate
 * @returns The validated model name (normalized to the correct case)
 * @throws Error if the model is not recognized, with a suggestion if available
 */
export function validateModelRecognition(model: string): string {
    // First, perform security validation
    const sanitized = validateModelName(model);

    // Check if model is in the supported list (case-insensitive)
    const modelLower = sanitized.toLowerCase();
    for (const supported of SUPPORTED_MODELS) {
        if (supported.toLowerCase() === modelLower) {
            return supported; // Return the correctly cased version
        }
    }

    // Model not found, try to find a close match
    const suggestion = findClosestModel(sanitized);

    if (suggestion) {
        throw new Error(`Model not recognized: ${model}. Did you mean ${suggestion}?`);
    }

    // No close match found, show all available models
    throw new Error(`Model not recognized: ${model}. Available models: ${SUPPORTED_MODELS.join(", ")}`);
}

/**
 * Builds the command-line arguments for the cursor agent command.
 *
 * @param options - Configuration options for the cursor agent
 * @returns Array of command-line arguments
 */
export function buildCursorArgs(options: RunCursorAgentOptions): string[] {
    const args: string[] = ["agent"];

    if (options.model) {
        const validatedModel = validateModelRecognition(options.model);
        args.push("--model", validatedModel);
    }

    if (options.print) {
        args.push("-p");
        if (options.outputFormat) {
            args.push("--output-format", options.outputFormat);
        }
    }

    return args;
}

/**
 * Builds the full cursor command string for shell execution.
 *
 * @param options - Configuration options for the cursor agent
 * @returns The full command string to execute
 */
export function buildCursorCommand(options: RunCursorAgentOptions): string {
    const args = buildCursorArgs(options);
    return `cursor ${args.join(" ")}`;
}

/**
 * Gets the appropriate shell and arguments for the current platform.
 *
 * @returns Object with shell path and arguments to execute a command
 */
function getShellConfig(): { shell: string; shellArgs: (cmd: string) => string[] } {
    if (process.platform === "win32") {
        return {
            shell: "cmd.exe",
            shellArgs: (cmd: string) => ["/c", cmd],
        };
    }
    // macOS and Linux - use the user's shell or default to bash
    const userShell = process.env.SHELL || "/bin/bash";
    return {
        shell: userShell,
        shellArgs: (cmd: string) => ["-c", cmd],
    };
}

/**
 * Runs the Cursor Agent CLI with the given prompt.
 *
 * Uses node-pty for cross-platform pseudo-terminal support (Windows, macOS, Linux).
 * The prompt is sent to the agent after it initializes.
 * In interactive mode (-i), the user can review and submit the prompt manually.
 *
 * @param prompt - The prompt to send to the agent
 * @param options - Optional configuration for print mode and output format
 * @returns Promise resolving with stdout, stderr, and exit code
 * @throws Error if the cursor command cannot be spawned
 */
export function runCursorAgent(prompt: string, options: RunCursorAgentOptions = {}): Promise<RunCursorAgentResult> {
    return new Promise((resolve, reject) => {
        const cursorCmd = buildCursorCommand(options);
        const { shell, shellArgs } = getShellConfig();
        const delay = (options.promptDelay ?? 1) * 1000;

        let stdout = "";
        // node-pty combines stdout/stderr into a single stream
        const stderr = "";

        let ptyProcess: pty.IPty;

        try {
            // Spawn through shell to properly resolve PATH and handle symlinks/scripts
            ptyProcess = pty.spawn(shell, shellArgs(cursorCmd), {
                name: "xterm-256color",
                cols: 120,
                rows: 30,
                cwd: process.cwd(),
                env: process.env as Record<string, string>,
            });
        } catch (err) {
            const error = err as NodeJS.ErrnoException;
            if (error.code === "ENOENT" || error.message?.includes("ENOENT")) {
                reject(
                    new Error(
                        "The 'cursor' command was not found in PATH. " +
                            "Make sure Cursor is installed and the CLI is available. " +
                            "You may need to run 'Install cursor command' from the Cursor command palette.",
                    ),
                );
            } else {
                reject(new Error(`Failed to spawn cursor agent: ${error.message}`));
            }
            return;
        }

        // Capture output
        ptyProcess.onData((data: string) => {
            stdout += data;
            if (options.interactive) {
                // In interactive mode, write directly to stdout for real-time feedback
                process.stdout.write(data);
            }
        });

        // Handle process exit
        ptyProcess.onExit(({ exitCode }) => {
            resolve({ stdout, stderr, exitCode });
        });

        // Send prompt after delay to allow agent to initialize
        setTimeout(() => {
            ptyProcess.write(prompt);

            if (!options.interactive) {
                // In non-interactive mode, submit the prompt immediately
                ptyProcess.write("\r");
            }
        }, delay);

        // In interactive mode, pipe stdin to the PTY for user interaction
        if (options.interactive) {
            // Enable raw mode to capture all keystrokes
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
            }
            process.stdin.resume();

            process.stdin.on("data", (data: Buffer) => {
                ptyProcess.write(data.toString());
            });

            // Handle Ctrl+C to gracefully exit
            process.on("SIGINT", () => {
                ptyProcess.kill();
            });

            // Restore terminal on exit
            ptyProcess.onExit(() => {
                if (process.stdin.isTTY) {
                    process.stdin.setRawMode(false);
                }
                process.stdin.pause();
            });
        }
    });
}
