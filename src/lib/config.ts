/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import fs from "node:fs/promises";
import path from "node:path";

export type ImpactPatterns = {
    build: string[];
    env: string[];
    api: string[];
    architecture: string[];
};

export type AiwConfig = {
    impactPatterns: ImpactPatterns;
    projectContextPath: string;
    skipToken: string;
};

const DEFAULT_IMPACT_PATTERNS: ImpactPatterns = {
    build: ["package.json", "package-lock.json", "tsconfig*.json", "*.config.{js,ts,mjs}"],
    env: [".env.example", "docker-compose*.yml", "Dockerfile*", "infra/**"],
    api: ["*.graphql", "openapi*.{json,yaml}", "**/routes/**", "**/api/**"],
    architecture: ["src/**/index.ts", "src/**/mod.ts", "cmd/**", "apps/**"],
};

const DEFAULT_CONFIG: AiwConfig = {
    impactPatterns: DEFAULT_IMPACT_PATTERNS,
    projectContextPath: "docs/PROJECT_CONTEXT.md",
    skipToken: "[context-skip]",
};

/**
 * Load and parse .aiw.json config file, merging with defaults.
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Merged config with defaults
 */
export async function loadConfig(repoRoot?: string): Promise<AiwConfig> {
    const root = repoRoot ?? process.cwd();
    const configPath = path.join(root, ".aiw.json");

    try {
        const content = await fs.readFile(configPath, "utf8");
        const userConfig = JSON.parse(content) as Partial<AiwConfig>;

        // Merge with defaults, ensuring all required fields are present
        return {
            impactPatterns: {
                build: userConfig.impactPatterns?.build ?? DEFAULT_IMPACT_PATTERNS.build,
                env: userConfig.impactPatterns?.env ?? DEFAULT_IMPACT_PATTERNS.env,
                api: userConfig.impactPatterns?.api ?? DEFAULT_IMPACT_PATTERNS.api,
                architecture: userConfig.impactPatterns?.architecture ?? DEFAULT_IMPACT_PATTERNS.architecture,
            },
            projectContextPath: userConfig.projectContextPath ?? DEFAULT_CONFIG.projectContextPath,
            skipToken: userConfig.skipToken ?? DEFAULT_CONFIG.skipToken,
        };
    } catch (error) {
        // If file doesn't exist or can't be read, return defaults
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            return DEFAULT_CONFIG;
        }

        // If JSON is invalid, log warning and return defaults
        if (error instanceof SyntaxError) {
            console.warn(`Warning: Invalid JSON in ${configPath}, using defaults`);
            return DEFAULT_CONFIG;
        }

        // For other errors, return defaults
        return DEFAULT_CONFIG;
    }
}

/**
 * Get default config (useful for testing or when config file is not needed).
 *
 * @returns Default config
 */
export function getDefaultConfig(): AiwConfig {
    return { ...DEFAULT_CONFIG };
}
