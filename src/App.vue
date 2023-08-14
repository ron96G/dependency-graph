<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';
import Graph from './components/graph/Graph.vue';
import ImportStart from './components/importer/ImportStart.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';
import LightDarkModeSwitch from './components/LightDarkModeSwitch.vue';
import Notifications from './components/Notifications.vue';
import type { GraphData } from './components/importer/formatter';

const showNotifications: Ref<boolean> = ref(false)

let showGraph: Ref<boolean> = ref(false);
let progress: Ref<number> = ref(0);
let loading: Ref<boolean> = ref(false);
let data: Ref<GraphData | null> = ref(null);
let logs: Ref<Array<String>> = ref([]);

function onProgress(p: number) {
  loading.value = true
  progress.value = p > 100 ? 100 : p
}

function onFinished() {
  loading.value = false
  showGraph.value = true
  console.log("finished")
}

function onData(inData: GraphData) {
  if (inData)
    data.value = inData
}

function onLogs(msg: String) {
  logs.value.push(msg)
}

</script>

<template>
  <main>
    <LightDarkModeSwitch />
    <Notifications v-if="showNotifications" />

    <LoadingOverlay v-if="loading" :progress="progress" type="progressbar" :logs="logs" />

    <ImportStart v-show="!showGraph && !loading" @progress="onProgress" @finished="onFinished" @data="onData"
      @logs="onLogs" />

    <Graph v-if="showGraph" :data="data" />

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