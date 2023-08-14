<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, type Ref } from 'vue';

import type { GraphData, INode } from '@antv/g6';
import G6, { Graph } from '@antv/g6';

import { ALL_SELECTED_STATES, COLORS, SELECTED_STATE, SOURCE_SELECTED_STATE, STROKES, TARGET_SELECTED_STATE } from '@/constants';
import { GraphEventHelper } from '../graph/graph-events';
import { GraphHelper } from '../graph/graph-helper';

const props = defineProps(['data'])
const emit = defineEmits(['updated'])

// Features
const enabledFilterByCluster = false;

let graph: Graph;
let graphDataJSON: string = "";
let graphHelper: GraphHelper;
let graphEventHelper: GraphEventHelper;
const clusterMap = new Map();
let loading = ref(true);

const tooltip = new G6.Tooltip({
    getContent(e) {
        if (e?.item?.getType() == "node") {
            const item = e.item as INode
            const model = item.getModel()
            const id = model.id as string
            const [groupId, artifactId] = id?.split("_")
            return `<div style='min-width: 200px;'>
                    <h3 class="text-3xl font-bold underline">Cluster: ${model.cluster || "unknown"}</h3>
                    <p>GroupId: ${groupId || "unknown"}</p>
                    <p>ArtifactId: ${artifactId || "unknown"}</p>
                    <p>Version: ${model.version || "unknown"}</p>
                    <p>Directly Required By: ${item.getOutEdges()?.length || 0}</p>
                    <p>Direct Dependencies: ${item.getInEdges()?.length || 0}</p>
                    ${model.versions ? `<p>All used versions: ${model.versions || "unknown"}</p>` : ""}
                </div>`;

        } else if (e?.item?.getType() == "edge") {
            const model = e.item.getModel()
            return `<div style='min-width: 200px;'>
                    <p>Module ${model.target}</p>
                    <p>Uses ${model.source}</p>
                    <p>In version ${model.label || 'unknown'}</p>
                </div>`
        }

        return `<div style='min-width: 200px;'>
                <p>❌ Missing ❌</p>
            </div>`

    },
});


// TODO: not working correctly
watch(() => props.data, async (newData) => {
    if (graph && newData) {
        await onData(graph, newData)
    }
}, {
    deep: true,
    immediate: true
})


const prepareDownload = () => {
    const blob = new Blob([graphDataJSON], { type: "application/json" })
    const url = window.URL.createObjectURL(blob);
    document.getElementById('download-button')!.setAttribute("href", url);
}
const onData = async (graph: Graph, rawData: GraphData) => {
    const data: GraphData = JSON.parse(JSON.stringify({
        nodes: rawData.nodes,
        edges: rawData.edges,
        combos: rawData.combos
    }))

    let clusterId = 0;
    data.nodes?.forEach((node) => {
        if (node.cluster && clusterMap.get(node.cluster) === undefined) {
            clusterMap.set(node.cluster, clusterId);
            clusterId++;
        }
        const cid = clusterMap.get(node.cluster);
        if (!node.style) {
            node.style = {};
        }
        node.style.fill = COLORS[cid % COLORS.length];
        node.style.stroke = STROKES[cid % STROKES.length];

        if (node.packaging == 'pom') {
            node.type = "star"
        }
        if (node.pomType == "parent") {
            node.type = "rect"
        }
    });

    console.log("Updated data")
    graph.data(data);

    console.log("Rendering")
    graph.render();

    const nodesWithMultipleVersions = graphHelper.findNodesWithMultipleVersions()
    for (let [node, versions] of nodesWithMultipleVersions) {
        node.getModel().versions = Array.from(versions.keys())
    }

    graphDataJSON = JSON.stringify({
        "nodes": data.nodes,
        "edges": data.edges
    }, null, 2);

    localStorage.setItem("latest-graph", graphDataJSON)
    prepareDownload()

    emit('updated')
}

onMounted(async () => {
    graph = new G6.Graph({
        container: 'container',
        width: window.innerWidth,
        height: window.innerHeight,
        fitView: true,
        layout: {
            type: 'comboCombined',
            center: [200, 200],     // The center of the graph by default
            gpuEnabled: false,      // Not supported
            workerEnabled: true,
        },
        plugins: [tooltip],
        modes: {
            default: [
                'drag-canvas',
                'zoom-canvas',
            ],
        },
        defaultNode: {
            size: 26,
            color: 'white',
            labelCfg: {
                positions: 'center',
                style: {
                    fontSize: 12,
                    stroke: '#00000',
                    fill: '#ffffff',
                }
            }
        },
        defaultEdge: {
            style: {
                endArrow: true
            },
            labelCfg: {
                positions: 'center',
                style: {
                    fontSize: 12,
                    stroke: '#00000',
                    fill: '#ffffff',
                }
            }
        },
        nodeStateStyles: {
            [SELECTED_STATE]: {
                stroke: '#00000',
                lineWidth: 3,
            },
            [TARGET_SELECTED_STATE]: {
                stroke: '#82b446',
                lineWidth: 3,
            },
            [SOURCE_SELECTED_STATE]: {
                stroke: '#4682b4',
                lineWidth: 3,
            },
        },
        edgeStateStyles: {
            [SELECTED_STATE]: {
                stroke: '#4682b4',
            },
            [SOURCE_SELECTED_STATE]: {
                stroke: '#4682b4',
            },
            [TARGET_SELECTED_STATE]: {
                stroke: '#82b446',
            },
        },
    });

    graphEventHelper = new GraphEventHelper(graph)
    graphEventHelper.registerEvents(() => {
        loading.value = false;
    })

    graphHelper = new GraphHelper(graph)

    graphEventHelper.updateSize()
    window.onresize = graphEventHelper.updateSize

    if (props.data)
        await onData(graph, props.data)
})



/* 
    Function Calls 
*/

function filter(event: any) {
    const input = event.target.value;
    if (!input || input == "") {
        graphHelper.toggleVisibilityAll(true)
    } else {
        // TODO: improve this
        const patterns = input.split(" ")
        let items;
        if (patterns.length > 1) {
            items = graphHelper.findAllWithPatterns(patterns, 'node')
        } else {
            items = graphHelper.findAllWithPattern(patterns[0], 'node')
        }
        graphHelper.toggleVisibility(items, true)
    }

}

const state_showAll = ref(true)

const showAll = () => {
    state_showAll.value = !state_showAll.value
    graphHelper.toggleVisibilityAll(state_showAll.value)
}
const showAllButtonText = computed(() => {
    return state_showAll.value ? 'Hide All' : 'Show All'
})

const state_hideNonSelected = ref(false)
function hideNonSelected() {
    state_hideNonSelected.value = !state_hideNonSelected.value
    if (state_hideNonSelected.value) {
        const nodes = graphHelper.findAllByState('node', ...ALL_SELECTED_STATES)
        graphHelper.toggleVisibility(nodes, state_hideNonSelected.value)
    } else {
        graphHelper.toggleVisibilityAll(true)
    }

}

const hideNonSelectedButtonText = computed(() => {
    return state_hideNonSelected.value ? 'Show All' : 'Hide Non-Selected'
})


function selectAll() {
    graphHelper.selectAllVisible()
}

function unselectAll() {
    graphHelper.unselectAll()
}

function resetAll() {
    localStorage.clear()
    location.reload()
}

</script>

<template>
    <div id="wrapper">
        <div id="header">
            <scale-text-field @keyup.enter="filter" id="input-text" class="header-item"
                label="Filter using Regex"></scale-text-field>
            <scale-button @click="showAll" class="header-item">{{ showAllButtonText }}</scale-button>
            <scale-button @click="hideNonSelected" class="header-item">{{ hideNonSelectedButtonText }}</scale-button>
            <scale-button @click="selectAll" class="header-item">Select all</scale-button>
            <scale-button @click="unselectAll" class="header-item">Unselect all</scale-button>
            <scale-button @click="resetAll" class="header-item">Reset</scale-button>
            <scale-button class="header-item" id="download-button" download="my-dependencies.json">Download</scale-button>
        </div>

        <div id="header">
            <scale-dropdown-select v-if="enabledFilterByCluster" id="cluster-select" label="Filter by Cluster">
                <scale-dropdown-select-item value="">None</scale-dropdown-select-item>
                <template v-for="cluster in clusterMap.keys()">
                    <scale-dropdown-select-item :value="cluster">{{ cluster }}</scale-dropdown-select-item>
                </template>
            </scale-dropdown-select>
        </div>

        <div id="content">
            <div id="container" v-show="!loading"></div>
            <scale-loading-spinner size="large" text="Loading ..." v-show="loading"></scale-loading-spinner>
        </div>
    </div>
</template>


<style scoped>
#wrapper {
    display: block;
    height: 100vh;
    position: relative;
    overflow: hidden;
}

#header {
    margin-top: 5px;
    display: flex;
}

#content {
    display: flex;

    justify-content: center;
    align-items: center;
    height: 80%;
}

#container {
    width: 100%;
}

#input-text {
    width: 20vw;
}

.header-item {
    margin: 2px;
}

#cluster-select {
    min-width: 20vw;
}
</style>