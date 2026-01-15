/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { titleCaseFromSlug } from "../lib/slug.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load markdown scaffold templates at module initialization
const SCAFFOLD_BLANK = readFileSync(path.join(__dirname, "scaffolds", "blank.md"), "utf8");
const SCAFFOLD_REPO = readFileSync(path.join(__dirname, "scaffolds", "repo.md"), "utf8");
const SCAFFOLD_REVIEW = readFileSync(path.join(__dirname, "scaffolds", "review.md"), "utf8");
const SCAFFOLD_FEATURE = readFileSync(path.join(__dirname, "scaffolds", "feature.md"), "utf8");
const SCAFFOLD_DEBUG = readFileSync(path.join(__dirname, "scaffolds", "debug.md"), "utf8");

/**
 * Simple template replacement function.
 * @param template
 * @param vars
 */
function replaceTemplateVars(template: string, vars: Record<string, string>): string {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? `\${${key}}`);
}

export type ScaffoldFrom = "blank" | "repo" | "review" | "feature" | "debug";

/**
 *
 * @param opts
 * @param opts.slug
 * @param opts.title
 * @param opts.from
 * @param opts.workspaceDirRelative
 */
export function scaffoldPromptMarkdown(opts: { slug: string; title?: string; from: ScaffoldFrom; workspaceDirRelative: string }): string {
    const title = opts.title?.trim() || titleCaseFromSlug(opts.slug);
    const ws = opts.workspaceDirRelative || ".ai";

    const header = `---\ntitle: ${title}\nslug: ${opts.slug}\n---\n\n`;

    let template: string;
    switch (opts.from) {
        case "repo":
            template = SCAFFOLD_REPO;
            break;
        case "review":
            template = SCAFFOLD_REVIEW;
            break;
        case "feature":
            template = SCAFFOLD_FEATURE;
            break;
        case "debug":
            template = SCAFFOLD_DEBUG;
            break;
        case "blank":
        default:
            template = SCAFFOLD_BLANK;
            break;
    }

    // Replace template variables
    const content = replaceTemplateVars(template, { ws });

    return header + content;
}
