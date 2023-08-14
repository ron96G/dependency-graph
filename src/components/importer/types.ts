
export interface IModuleInfo {
    groupId: string
    artifactId: string
    version: string

    toString: () => string;
}

export interface IPOMInfo {
    packaging: string;
    self: IModuleInfo | null;
    parent: IModuleInfo | null;
    dependencies: IModuleInfo[];
}

export interface INode {
    id: string | undefined
    label: string | undefined
    version: string | undefined
    cluster: string | undefined
    packaging: string
}

export interface IEdge {
    source: string | undefined
    target: string | undefined
    label: string | undefined
}

export interface IGraphData {
    nodes: INode[]
    edges: IEdge[]
    combos?: any[]
}