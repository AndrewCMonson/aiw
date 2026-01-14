/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";

import { getPromptContents } from "./show.js";
import { runCursorAgent } from "../lib/cursorAgent.js";

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

            // Run via Cursor Agent
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
        },
    );

    return cmd;
}
