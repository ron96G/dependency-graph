
export interface IModuleInfo {
    groupId: string
    artifactId: string
    version: string
}

export interface IPOMInfo {
    packaging: string;
    info: IModuleInfo;
    parent: IModuleInfo;
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