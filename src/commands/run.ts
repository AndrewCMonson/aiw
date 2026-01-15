/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";

import { getPromptContents } from "./show.js";
import { startCompletionWatcher } from "../lib/completionWatcher.js";
import { runCursorAgent, spawnCursorAgent } from "../lib/cursorAgent.js";
import { getHeadSha } from "../lib/git.js";

/**
 * Combines prompt contents with optional user input.
 *
 * @param promptContents - The base prompt template contents
 * @param userInput - Optional user input to append
 * @returns Combined prompt string
 */
function combinePromptWithInput(promptContents: string, userInput?: string): string {
    if (!userInput || userInput.trim() === "") {
        return promptContents;
    }

    return `${promptContents}\n\n---\nUser Input:\n${userInput}`;
}

/**
 *
 */
export function runCommand(): Command {
    const cmd = new Command("run")
        .description("Run a prompt via Cursor Agent CLI")
        .argument("<prompt>", "Prompt name/slug")
        .argument("[input...]", "Optional user input to append to the prompt")
        .option("--workspace <path>", "Workspace folder (default: .ai)")
        .option("-i, --interactive", "Fully interactive mode (allows typing responses)")
        .option("--no-auto-exit", "Disable auto-exit after artifact detection (interactive mode only)")
        .option("-p, --print", "Run in print mode (non-interactive, for scripting)")
        .option("--output-format <format>", "Output format: text or json", "text")
        .option("-m, --model <model>", "Model to use (e.g., gpt-5, sonnet-4, sonnet-4-thinking)");

    cmd.action(
        async (
            prompt: string,
            input: string[],
            options: {
                workspace?: string;
                interactive?: boolean;
                autoExit?: boolean;
                print?: boolean;
                outputFormat?: string;
                model?: string;
            },
        ) => {
            // Get prompt contents from workspace
            const { slug, contents } = await getPromptContents({
                workspace: options.workspace,
                promptName: prompt,
            });

            // Combine prompt with user input if provided
            const userInput = input.join(" ");
            const combinedPrompt = combinePromptWithInput(contents, userInput);

            // Only show status message in non-interactive mode
            if (!options.interactive) {
                process.stdout.write(`Running prompt "${slug}" via Cursor Agent...\n\n`);
            }

            // Debug: show prompt length
            if (process.env.DEBUG) {
                process.stderr.write(`[DEBUG] Prompt length: ${combinedPrompt.length} chars\n`);
            }

            // Auto-exit is enabled by default for interactive mode, unless --no-auto-exit is specified
            // Commander.js: --no-auto-exit sets autoExit to false, otherwise it's true/undefined
            const autoExitEnabled = options.interactive && options.autoExit !== false;

            // Check Windows support for auto-exit
            const isWindows = process.platform === "win32";
            if (autoExitEnabled && isWindows) {
                process.stderr.write("⚠️  Auto-exit not fully supported on Windows. Exit manually with Ctrl+C.\n");
            }

            // If auto-exit is enabled, use spawnCursorAgent and set up completion watcher
            if (autoExitEnabled && !isWindows) {
                const sessionStartTime = Date.now();
                const headSha = getHeadSha();

                // Show auto-exit status message
                process.stdout.write("Auto-exit enabled: session will close after review artifact is written.\n");
                process.stdout.write("Use --no-auto-exit to keep the session open.\n\n");

                // Start completion watcher with prompt slug for prompt-aware detection
                // Only pass headSha for pre_push_review (only prompt that includes Head SHA in output)
                const watcher = startCompletionWatcher({
                    sessionStartTime,
                    headSha: slug === "pre_push_review" ? (headSha ?? undefined) : undefined,
                    promptSlug: slug,
                    workspace: options.workspace,
                });

                // Spawn Cursor Agent with handle
                const handle = spawnCursorAgent(combinedPrompt, {
                    print: options.print,
                    // Output format only applies to print mode
                    outputFormat: options.print ? (options.outputFormat as "text" | "json" | undefined) : undefined,
                    interactive: options.interactive,
                    model: options.model,
                });

                // Set up completion handler
                watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                    process.stdout.write(`\nArtifact detected (${artifactPath}). Auto-exiting interactive session...\n`);
                    watcher.stop();
                    // Use void to explicitly ignore the promise
                    void (async () => {
                        try {
                            await handle.kill();
                            // Exit successfully since we intentionally completed
                            process.exit(0);
                        } catch {
                            // If kill fails, still exit successfully (we detected completion)
                            process.exit(0);
                        }
                    })();
                });

                // Set up timeout handler
                watcher.on("timeout", () => {
                    process.stdout.write("\nAuto-exit timeout: completion not detected. Exit manually with Ctrl+C.\n");
                    watcher.stop();
                });

                // Wait for process to complete
                try {
                    const result = await handle.result;
                    // Stop watcher if process exited naturally (before completion detected)
                    watcher.stop();

                    // Exit with agent's exit code
                    if (result.exitCode !== 0) {
                        process.exitCode = result.exitCode;
                    }
                } catch (error) {
                    // Stop watcher on error
                    watcher.stop();
                    throw error;
                }
            } else {
                // Use regular runCursorAgent for non-interactive or when auto-exit is disabled
                const result = await runCursorAgent(combinedPrompt, {
                    print: options.print,
                    // Output format only applies to print mode
                    outputFormat: options.print ? (options.outputFormat as "text" | "json" | undefined) : undefined,
                    interactive: options.interactive,
                    model: options.model,
                });

                // Exit with agent's exit code
                if (result.exitCode !== 0) {
                    process.exitCode = result.exitCode;
                }
            }
        },
    );

    return cmd;
}
