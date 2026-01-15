/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type DefaultPrompt = {
    slug: string;
    filename: string;
    contents: string;
};

function loadPrompt(slug: string, filename: string): DefaultPrompt {
    const filePath = path.join(__dirname, "defaultPrompts", filename);
    const contents = readFileSync(filePath, "utf8");
    return { slug, filename, contents };
}

export const DEFAULT_PROMPTS: DefaultPrompt[] = [
    loadPrompt("repo_discover", "repo_discover.md"),
    loadPrompt("repo_refresh", "repo_refresh.md"),
    loadPrompt("pre_push_review", "pre_push_review.md"),
    loadPrompt("feature_plan", "feature_plan.md"),
    loadPrompt("debug_senior", "debug_senior.md"),
    loadPrompt("context_sync", "context_sync.md"),
];
