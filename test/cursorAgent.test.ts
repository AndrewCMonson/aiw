/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { describe, expect, it } from "vitest";

import {
    buildCursorArgs,
    buildCursorCommand,
    findClosestModel,
    validateModelName,
    validateModelRecognition,
} from "../src/lib/cursorAgent.js";

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

    describe("findClosestModel", () => {
        it("finds exact match (case-insensitive)", () => {
            expect(findClosestModel("opus-4.5")).toBe("opus-4.5");
            expect(findClosestModel("OPUS-4.5")).toBe("opus-4.5");
            expect(findClosestModel("Opus-4.5")).toBe("opus-4.5");
        });

        it("finds match with missing hyphen", () => {
            expect(findClosestModel("opus4.5")).toBe("opus-4.5");
            expect(findClosestModel("sonnet4.5")).toBe("sonnet-4.5");
            expect(findClosestModel("gpt5.2")).toBe("gpt-5.2");
            expect(findClosestModel("opus4.5thinking")).toBe("opus-4.5-thinking");
        });

        it("finds match with wrong separator (underscore instead of hyphen)", () => {
            expect(findClosestModel("opus_4.5")).toBe("opus-4.5");
            expect(findClosestModel("sonnet_4.5")).toBe("sonnet-4.5");
            expect(findClosestModel("gpt_5.2")).toBe("gpt-5.2");
        });

        it("returns null for no close match", () => {
            expect(findClosestModel("nonexistent-model")).toBeNull();
            expect(findClosestModel("xyz123")).toBeNull();
            expect(findClosestModel("completely-different")).toBeNull();
        });
    });

    describe("validateModelRecognition", () => {
        it("accepts valid supported models", () => {
            expect(validateModelRecognition("auto")).toBe("auto");
            expect(validateModelRecognition("opus-4.5")).toBe("opus-4.5");
            expect(validateModelRecognition("opus-4.5-thinking")).toBe("opus-4.5-thinking");
            expect(validateModelRecognition("sonnet-4.5")).toBe("sonnet-4.5");
            expect(validateModelRecognition("sonnet-4.5-thinking")).toBe("sonnet-4.5-thinking");
            expect(validateModelRecognition("gpt-5.2")).toBe("gpt-5.2");
            expect(validateModelRecognition("gemini-3-pro")).toBe("gemini-3-pro");
            expect(validateModelRecognition("gemini-3-flash")).toBe("gemini-3-flash");
        });

        it("normalizes case for valid models", () => {
            expect(validateModelRecognition("OPUS-4.5")).toBe("opus-4.5");
            expect(validateModelRecognition("Opus-4.5")).toBe("opus-4.5");
            expect(validateModelRecognition("SONNET-4.5")).toBe("sonnet-4.5");
        });

        it("suggests closest match for typos with missing hyphen", () => {
            expect(() => validateModelRecognition("opus4.5")).toThrow("Model not recognized: opus4.5. Did you mean opus-4.5?");
            expect(() => validateModelRecognition("sonnet4.5")).toThrow("Model not recognized: sonnet4.5. Did you mean sonnet-4.5?");
        });

        it("suggests closest match for typos with wrong separator", () => {
            expect(() => validateModelRecognition("opus_4.5")).toThrow("Model not recognized: opus_4.5. Did you mean opus-4.5?");
        });

        it("shows all available models when no close match found", () => {
            expect(() => validateModelRecognition("nonexistent")).toThrow("Model not recognized: nonexistent. Available models:");
            expect(() => validateModelRecognition("nonexistent")).toThrow("auto");
            expect(() => validateModelRecognition("nonexistent")).toThrow("opus-4.5");
        });

        it("still performs security validation (prevents command injection)", () => {
            expect(() => validateModelRecognition("test; rm -rf /")).toThrow("Invalid model name");
            expect(() => validateModelRecognition("test && echo pwned")).toThrow("Invalid model name");
            expect(() => validateModelRecognition('test"')).toThrow("Invalid model name");
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

        it("throws on invalid model name (security validation)", () => {
            expect(() => buildCursorArgs({ model: "bad; model" })).toThrow("Invalid model name");
        });

        it("throws on unrecognized model with suggestion", () => {
            expect(() => buildCursorArgs({ model: "opus4.5" })).toThrow("Model not recognized: opus4.5. Did you mean opus-4.5?");
        });

        it("throws on unrecognized model with all available models listed", () => {
            expect(() => buildCursorArgs({ model: "nonexistent" })).toThrow("Model not recognized: nonexistent. Available models:");
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
