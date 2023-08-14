import type { Graph, IEdge, INode } from "@antv/g6";
import { ALL_SELECTED_STATES, SELECTED_STATE, SOURCE_SELECTED_STATE, TARGET_SELECTED_STATE } from '@/constants'

export class GraphEventHelper {
    public graph: Graph;
    public isRendered = false;

    constructor(graph: Graph) {
        this.graph = graph;
    }

    updateEdge = (edge: IEdge, clear = false) => {
        const model = edge.getModel()
        const targets = [model.id, model.source, model.target] as string[]

        if (clear && edge.getStates().includes(SELECTED_STATE)) {
            targets.forEach(target => {
                this.graph.clearItemStates(target!, SELECTED_STATE);
            })
        } else {
            targets.forEach(target => {
                this.graph.setItemState(target!, SELECTED_STATE, true);
            })
        }
        return targets
    }

    selectNode = (node: INode, clear = false) => {
        const model = node.getModel()
        const nodes: string[] = [model.id!]
        const sources: string[] = []
        const targets: string[] = []
        node.getEdges().forEach(e => {
            if (e.getSource().getID() === node.getID()) {
                sources.push(e.getID(), e.getTarget().getID())
            } else {
                targets.push(e.getID(), e.getSource().getID())
            }
        })

        const all = nodes.concat(sources, targets)

        if (clear && node.getStates().includes(SELECTED_STATE)) {
            all.forEach(item => {
                this.graph.clearItemStates(item, ALL_SELECTED_STATES);
            })
        } else {
            nodes.forEach(item => {
                this.graph.setItemState(item, SELECTED_STATE, true);
            })
            sources.forEach(item => {
                this.graph.setItemState(item, SOURCE_SELECTED_STATE, true);
            })
            targets.forEach(item => {
                this.graph.setItemState(item, TARGET_SELECTED_STATE, true);
            })
        }
        return targets
    }

    registerEvents = (isRenderedCB: () => void) => {
        this.graph.on("node:click", (e) => {
            const node = e.item as INode
            this.selectNode(node, true)
        })

        this.graph.on("edge:click", (e) => {
            const edge = e.item as IEdge
            this.updateEdge(edge, true)
        })

        this.graph.on('afterrender', (e) => {
            console.log("Finished rendering")
            this.isRendered = true
            if (isRenderedCB) isRenderedCB()
        })
    }

    updateSize = () => {
        const containerId = this.graph.getContainer().id;
        const height = document.getElementById(containerId)?.clientHeight || window.innerHeight;
        const width = document.getElementById(containerId)?.clientWidth || window.innerWidth;
        this.graph.changeSize(width, height)
        this.graph.fitView()
        this.graph.refresh()
    }

}