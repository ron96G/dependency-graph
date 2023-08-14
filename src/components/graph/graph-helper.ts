import { ALL_SELECTED_STATES, SELECTED_STATE } from "@/constants";
import type { Graph, INode, Item } from "@antv/g6";

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

    findAllByState = (type: 'node' | 'edge', ...states: string[]) => {
        return states.map(state => this.graph.findAllByState(type, state)).flat(1)
    }

    findAllWithPattern = (pattern: string, type: 'node' | 'edge') => {
        const re = RegExp(pattern)
        return this.graph.findAll(type, item => re.test(item.getID()))
    }

    findAllWithPatterns = (patterns: string[], type: 'node' | 'edge') => {
        return patterns.map(pattern => this.findAllWithPattern(pattern, type)).flat(1)
    }

    toggleVisibility = (items: Item[], visible = false) => {
        const nodeIdLookup = new Map();
        const edgeIdLookup = new Map();

        items.forEach(item => nodeIdLookup.set(item.getID(), true))

        for (const item of items) {
            if (item.getType() == 'node') {
                const node = item as INode;
                node.getOutEdges().forEach(edge => {
                    if (nodeIdLookup.has(edge.getTarget().getID())) {
                        edgeIdLookup.set(edge.getID(), true)
                    }
                })
            }
        }

        this.graph.getNodes().forEach(node => {
            if (nodeIdLookup.has(node.getID())) {
                node.changeVisibility(visible)
                node.getEdges()
                    .filter(e => edgeIdLookup.has(e.getID()))
                    .forEach(e => e.changeVisibility(visible))
            } else {
                node.changeVisibility(!visible)
                node.getEdges()
                    .filter(e => !edgeIdLookup.has(e.getID()))
                    .forEach(e => e.changeVisibility(!visible))
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

    selectAllVisible = () => {
        return this.graph
            .findAll('node', i => i.isVisible())
            .map(i => i.setState(SELECTED_STATE, true))
    }

    unselectAll = () => {
        this.findAllByState('node', ...ALL_SELECTED_STATES)
            .forEach(item =>
                item.clearStates(ALL_SELECTED_STATES)
            )

        this.findAllByState('edge', ...ALL_SELECTED_STATES)
            .forEach(item =>
                item.clearStates(ALL_SELECTED_STATES)
            )
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