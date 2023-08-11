import type { Graph, INode, Item } from "@antv/g6";
import { minimatch } from 'minimatch';

export class GraphHelper {

    public graph: Graph;

    constructor(graph: Graph) {
        this.graph = graph;
    }

    findItem = (id: string, type: 'node' | 'edge') => {
        const item = this.graph.findById(id)
        if (item.getType() == type) {
            return item as INode
        }
        throw Error(`Item '${id}' is type '${item.getType()}'. Expected type '${type}'`)
    }

    findNodeWithID = (id: string) => {
        return this.findItem(id, 'node')
    }

    findEdgeWithID = (id: string) => {
        return this.findItem(id, 'edge')
    }

    findAllByState = (state: string, type: 'node' | 'edge') => {
        return this.graph.findAllByState(type, state)
    }

    findAllWithPattern = (pattern: string, type: 'node' | 'edge') => {
        return this.graph.findAll(type, item => minimatch(item.getID(), pattern))
    }

    findAllWithPatterns = (patterns: string[], type: 'node' | 'edge') => {
        return patterns.map(pattern => this.findAllWithPattern(pattern, type)).flat(1)
    }

    toggleVisibility = (items: Item[], visible = false) => {
        const idLookup = new Map();
        items.forEach(item => idLookup.set(item.getID(), true))
        this.graph.getNodes().forEach(node => {
            if (idLookup.has(node.getID())) {
                node.changeVisibility(visible)
            } else {
                node.changeVisibility(!visible)
                node.getEdges().forEach(e => e.changeVisibility(!visible))
            }
        })
    }

    toggleVisibilityAll = (visible = false) => {
        this.graph.getNodes().forEach(node => {
            node.changeVisibility(visible)
            node.getEdges().forEach(e => e.changeVisibility(visible))
        })
    }

    getMultipleVersions = (node: INode): Map<string, number> => {
        const versions = new Map<string, number>();
        node.getOutEdges().forEach(edge => {
            const version = edge.getModel().label as string // check string & semver
            if (versions.has(version)) {
                const cur = versions.get(version)
                versions.set(version, cur ? cur + 1 : 1)
            } else {
                versions.set(version, 1)
            }
        })
        return versions;
    }

    findNodesWithMultipleVersions = (pattern?: string) => {
        let items: INode[];
        if (pattern) {
            items = this.findAllWithPattern(pattern, 'node') as INode[]
        } else {
            items = this.graph.getNodes()
        }
        const m = new Map<INode, Map<string, number>>();

        items.forEach(node => {
            m.set(node, this.getMultipleVersions(node))
        })

        for (let [node, versionsMap] of m) {
            if (versionsMap == undefined || versionsMap.size <= 1) {
                m.delete(node)
           }
        }
        return m
    }
}