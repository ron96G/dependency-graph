<script setup lang="ts">
import { ref, type Ref } from 'vue';
import Graph from './components/graph/Graph.vue';
import ImportStart from './components/importer/ImportStart.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';
import LightDarkModeSwitch from './components/LightDarkModeSwitch.vue';
import Notifications from './components/Notifications.vue';
import { type GraphData } from '@/libs/importer/formatter';
import { type Event } from '@/libs/common';

let showGraph: Ref<boolean> = ref(false);
let progress: Ref<number> = ref(0);
let loading: Ref<boolean> = ref(false);
let data: Ref<GraphData | null> = ref(null);
let logs: Ref<Array<string>> = ref([]);
let errors: Ref<Array<string>> = ref([])

function onProgress(p: number) {
  loading.value = true
  progress.value = p > 100 ? 100 : p
}

function onFinished() {
  loading.value = false
  showGraph.value = true
}

function onData(inData: GraphData) {
  if (inData)
    data.value = inData
}

function onLogs(e: Event) {
  console.log(`${e.level}: ${e.message}`)
  if (e.level === 'error') {
    console.log('received error')
    errors.value.push(e.message)
  } else {
    logs.value.push(`${e.level}: ${e.message}`)
  }
}

</script>

<template>
  <main>
    <LightDarkModeSwitch />
    <Notifications :in-errors="errors" />

    <LoadingOverlay v-if="loading" :progress="progress" type="progressbar" :logs="logs" />

    <ImportStart v-show="!showGraph && !loading" @progress="onProgress" @finished="onFinished" @data="onData"
      @logs="onLogs" @errors="onLogs" />

    <Graph v-if="showGraph" :data="data" @errors="onLogs" />

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
</style>../lib/importer/formatter./libs/common