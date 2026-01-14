import { spawnSync } from "node:child_process";
function tryCommand(command, args, text) {
    const res = spawnSync(command, args, {
        input: text,
        encoding: "utf8",
        stdio: ["pipe", "ignore", "ignore"],
        shell: false
    });
    if (res.error)
        return { ok: false, error: res.error.message };
    if (res.status === 0)
        return { ok: true };
    return { ok: false, error: `exit ${res.status ?? "unknown"}` };
}
export function copyToClipboard(text) {
    const platform = process.platform;
    if (platform === "darwin") {
        const r = tryCommand("pbcopy", [], text);
        return r.ok ? { copied: true, method: "pbcopy" } : { copied: false, reason: r.error ?? "pbcopy failed" };
    }
    if (platform === "win32") {
        // `clip` is a shell builtin-ish command; run through cmd.
        const res = spawnSync("cmd", ["/c", "clip"], {
            input: text,
            encoding: "utf8",
            stdio: ["pipe", "ignore", "ignore"],
            shell: false
        });
        if (res.error)
            return { copied: false, reason: res.error.message };
        if (res.status === 0)
            return { copied: true, method: "clip" };
        return { copied: false, reason: `clip exit ${res.status ?? "unknown"}` };
    }
    // Linux / other: try common clipboard tools.
    for (const attempt of [
        { cmd: "wl-copy", args: [] },
        { cmd: "xclip", args: ["-selection", "clipboard"] },
        { cmd: "xsel", args: ["--clipboard", "--input"] }
    ]) {
        const r = tryCommand(attempt.cmd, attempt.args, text);
        if (r.ok)
            return { copied: true, method: attempt.cmd };
    }
    return {
        copied: false,
        reason: "No clipboard tool found (tried pbcopy/clip/wl-copy/xclip/xsel depending on OS)."
    };
}
