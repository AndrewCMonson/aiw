/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { describe, expect, it } from "vitest";

import { buildCursorArgs, buildCursorCommand, validateModelName } from "../src/lib/cursorAgent.js";

describe("cursorAgent", () => {
    describe("validateModelName", () => {
        it("accepts valid model names with alphanumeric characters", () => {
            expect(validateModelName("gpt5")).toBe("gpt5");
            expect(validateModelName("sonnet4")).toBe("sonnet4");
            expect(validateModelName("claude3")).toBe("claude3");
        });

        it("accepts model names with dots", () => {
            expect(validateModelName("gpt-5.2")).toBe("gpt-5.2");
            expect(validateModelName("sonnet-4.5")).toBe("sonnet-4.5");
        });

        it("accepts model names with hyphens", () => {
            expect(validateModelName("sonnet-4")).toBe("sonnet-4");
            expect(validateModelName("opus-4.5-thinking")).toBe("opus-4.5-thinking");
        });

        it("accepts model names with underscores", () => {
            expect(validateModelName("gpt_5")).toBe("gpt_5");
            expect(validateModelName("sonnet_4_thinking")).toBe("sonnet_4_thinking");
        });

        it("rejects model names with shell metacharacters", () => {
            expect(() => validateModelName("test; rm -rf /")).toThrow("Invalid model name");
            expect(() => validateModelName("test && echo pwned")).toThrow("Invalid model name");
            expect(() => validateModelName("test | cat /etc/passwd")).toThrow("Invalid model name");
        });

        it("rejects model names with quotes", () => {
            expect(() => validateModelName('test"')).toThrow("Invalid model name");
            expect(() => validateModelName("test'")).toThrow("Invalid model name");
            expect(() => validateModelName("test`")).toThrow("Invalid model name");
        });

        it("rejects model names with special characters", () => {
            expect(() => validateModelName("test$var")).toThrow("Invalid model name");
            expect(() => validateModelName("test$(cmd)")).toThrow("Invalid model name");
            expect(() => validateModelName("test>file")).toThrow("Invalid model name");
            expect(() => validateModelName("test<file")).toThrow("Invalid model name");
        });

        it("rejects model names with spaces", () => {
            expect(() => validateModelName("model name")).toThrow("Invalid model name");
        });
    });

    describe("buildCursorArgs", () => {
        it("returns base args with no options", () => {
            const args = buildCursorArgs({});
            expect(args).toEqual(["agent"]);
        });

        it("adds model flag when specified", () => {
            const args = buildCursorArgs({ model: "sonnet-4.5" });
            expect(args).toEqual(["agent", "--model", "sonnet-4.5"]);
        });

        it("adds print flag when specified", () => {
            const args = buildCursorArgs({ print: true });
            expect(args).toEqual(["agent", "-p"]);
        });

        it("adds output format with print flag", () => {
            const args = buildCursorArgs({ print: true, outputFormat: "json" });
            expect(args).toEqual(["agent", "-p", "--output-format", "json"]);
        });

        it("ignores output format without print flag", () => {
            const args = buildCursorArgs({ outputFormat: "json" });
            expect(args).toEqual(["agent"]);
        });

        it("combines all options correctly", () => {
            const args = buildCursorArgs({
                model: "gpt-5.2",
                print: true,
                outputFormat: "text",
            });
            expect(args).toEqual(["agent", "--model", "gpt-5.2", "-p", "--output-format", "text"]);
        });

        it("throws on invalid model name", () => {
            expect(() => buildCursorArgs({ model: "bad; model" })).toThrow("Invalid model name");
        });

        it("does not include interactive in args (handled by PTY)", () => {
            const args = buildCursorArgs({ interactive: true });
            expect(args).toEqual(["agent"]);
        });

        it("does not include promptDelay in args (handled by setTimeout)", () => {
            const args = buildCursorArgs({ promptDelay: 5 });
            expect(args).toEqual(["agent"]);
        });
    });

    describe("buildCursorCommand", () => {
        it("builds base command with no options", () => {
            const cmd = buildCursorCommand({});
            expect(cmd).toBe("cursor agent");
        });

        it("builds command with model", () => {
            const cmd = buildCursorCommand({ model: "sonnet-4.5" });
            expect(cmd).toBe("cursor agent --model sonnet-4.5");
        });

        it("builds command with print mode", () => {
            const cmd = buildCursorCommand({ print: true });
            expect(cmd).toBe("cursor agent -p");
        });

        it("builds command with all options", () => {
            const cmd = buildCursorCommand({
                model: "gpt-5.2",
                print: true,
                outputFormat: "json",
            });
            expect(cmd).toBe("cursor agent --model gpt-5.2 -p --output-format json");
        });
    });
});
