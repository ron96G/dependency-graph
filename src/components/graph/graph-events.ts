import type { Graph, IEdge, INode } from "@antv/g6";


export class GraphEventHelper {
    public graph: Graph;
    public isRendered = false;

    constructor(graph: Graph) {
        this.graph = graph;
    }

    updateEdge = (edge: IEdge, targetState: string, clear=false) => {
        const model = edge.getModel()
        const targets = [ model.id, model.source, model.target ] as string[]
    
        if (clear && edge.getStates().includes(targetState)) {
            targets.forEach(target => {
                this.graph.clearItemStates(target!, targetState);
            })
        } else {
            targets.forEach(target => {
                this.graph.setItemState(target!, targetState, true);
            })
        }
        return targets
    }

    updateNode = (node: INode , targetState: string, clear=false) => {
        const model = node.getModel()
        const targets = [ model.id ]
        node.getEdges().forEach( e => {
            targets.push(e.getID(), e.getSource().getID(), e.getTarget().getID())
        })
    
        if (clear && node.getStates().includes(targetState)) {
            targets.forEach(target => {
                this.graph.clearItemStates(target!, targetState);
            })
        } else {
            targets.forEach(target => {
                this.graph.setItemState(target!, targetState, true);
            })
        }
        return targets
    }

    registerEvents = (isRenderedCB: () => void) => {
        this.graph.on("node:click", (e) => {
            const targetState = "selected"
            const node = e.item as INode
            const targets = this.updateNode(node, targetState, true)
        })
    
        this.graph.on("edge:click", (e) => {
            const targetState = "selected"
            const edge = e.item as IEdge
            const targets = this.updateEdge(edge, targetState, true)
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