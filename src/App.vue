<script setup lang="ts">
import type { GraphData } from '@antv/g6';
import { onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';
import type { MutationPayload } from 'vuex';
import Graph from './components/graph/Graph.vue';
import ImportStart from './components/importer/ImportStart.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';

const store = useStore()
let showGraph = ref(false)

const latestGraph = localStorage.getItem("latest-graph")
if (latestGraph !== null) {
  console.log("Reusing latest graph")
  store.commit("updateGraphData", JSON.parse(latestGraph))
  showGraph.value = true

} else {
  const unsubscribe = store.subscribe((mutation: MutationPayload, graphData: GraphData) => {
    if (mutation.type === "updateGraphData") {
      console.log("Updated graph data")
      showGraph.value = true
    }
  })

  onUnmounted(() => {
    unsubscribe()
  })
}


</script>

<template>
  <main>
    <LoadingOverlay />
    <ImportStart v-if="!showGraph" />
    <Graph v-else />
  </main>
</template>



<style>
.unselectable {
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>