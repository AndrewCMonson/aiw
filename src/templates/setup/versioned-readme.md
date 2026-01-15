# ${title}

${description}

## Filename Format

Files in this directory use the following naming format:

\`YYYY-MM-DD*HHMMSS*<id>\_<descriptor>.md\`

- \`YYYY-MM-DD_HHMMSS\` - Timestamp when the file was created (24-hour format)
- \`<id>\` - Unique 6-8 character identifier
- \`<descriptor>\` - Descriptive name (includes branch name for features/bugs)

## Examples

- \`2024-01-15_143022_a3f9b2_feature-user-auth_oauth-integration.md\`
- \`2024-01-15_143022_b7c4d1_bugfix-login-error_null-pointer.md\`

## Finding Files

- List all files: \`ls .ai/context/${subdir}/\`
- Find by date: \`ls .ai/context/${subdir}/ | grep 2024-01-15\`
- Find by branch: \`ls .ai/context/${subdir}/ | grep feature-user-auth\`
