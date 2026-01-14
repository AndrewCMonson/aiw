import { spawnSync } from "node:child_process";
export function openPath(filePath) {
    const platform = process.platform;
    if (platform === "darwin") {
        const res = spawnSync("open", [filePath], { stdio: "ignore" });
        if (res.error)
            return { opened: false, reason: res.error.message };
        return res.status === 0
            ? { opened: true, method: "open" }
            : { opened: false, reason: `open exit ${res.status ?? "unknown"}` };
    }
    if (platform === "win32") {
        // `start` requires cmd; empty title arg prevents treating path as title.
        const res = spawnSync("cmd", ["/c", "start", "", filePath], { stdio: "ignore" });
        if (res.error)
            return { opened: false, reason: res.error.message };
        return res.status === 0
            ? { opened: true, method: "start" }
            : { opened: false, reason: `start exit ${res.status ?? "unknown"}` };
    }
    const res = spawnSync("xdg-open", [filePath], { stdio: "ignore" });
    if (res.error)
        return { opened: false, reason: res.error.message };
    return res.status === 0
        ? { opened: true, method: "xdg-open" }
        : { opened: false, reason: `xdg-open exit ${res.status ?? "unknown"}` };
}
