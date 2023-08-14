import type { IEdge, IGraphData, INode, IPOMInfo } from "./types"
import { makeCluster, makeId } from "./utils"
import type { ModuleInfo } from "./pom-parser"

export class Node implements INode {
    id: string | undefined
    label: string | undefined
    version: string | undefined
    cluster: string | undefined
    packaging: string
    pomType?: string

    constructor(info: ModuleInfo, packaging = "jar", pomType?: string) {
        this.id = makeId(info)
        this.label = info.artifactId
        this.version = info.version
        this.cluster = makeCluster(info)
        this.packaging = packaging
        this.pomType = pomType
    }
}

export class Edge implements IEdge {
    source: string | undefined
    target: string | undefined
    label: string | undefined

    constructor(source: string, target: string, label: string) {
        this.source = source;
        this.target = target;
        this.label = label;
    }
}

export class GraphData implements IGraphData {
    nodesLookup: Map<string, INode> = new Map();
    edges: IEdge[] = []

    public get nodes() {
        return Array.from(this.nodesLookup.values())
    }

    inject = (...poms: IPOMInfo[]) => {
        for (const pom of poms) {
            if (pom.self == null) {
                console.log('Ignoring null pom')
                continue
            }
            const id = makeId(pom.self);
            this.nodesLookup.set(id, new Node(pom.self, pom.packaging))
            if (pom.parent) {
                const parentId = makeId(pom.parent)
                this.nodesLookup.set(parentId, new Node(pom.parent, pom.packaging, "parent"))
                pom.dependencies.push(pom.parent)
            }

            for (const dependency of pom.dependencies) {
                const depId = makeId(dependency)

                if (!this.nodesLookup.has(depId)) {
                    const node = new Node(dependency, "jar")
                    this.nodesLookup.set(depId, node)
                }
                this.edges.push(new Edge(depId, id, dependency.version))
            }
        }
    }
}
