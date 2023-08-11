import type { IModuleInfo } from "./types"

export const makeCluster = (info: IModuleInfo) => {
    if (info.groupId === undefined) return "unknown"
    if (!info.groupId.includes("telekom")) return "external"
    const parts = info.groupId.split(".")
    return parts[parts.length - 1]
}

export const makeId = (info: IModuleInfo) => {
    return info.groupId + "_" + info.artifactId;
}