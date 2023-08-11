
<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { useStore } from "vuex";

const store = useStore()
let loading = ref(false)

const unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === "updateLoading") {
        console.log(`Changing loading`)
        loading.value = mutation.payload
    }
})

onUnmounted(() => {
    unsubscribe()
})
</script>


<template >
    <div id="wrapper" v-if="loading">
        <div id="content">
            <scale-loading-spinner size="large" text="Loading ..."></scale-loading-spinner>
        </div>
    </div>
</template>


<style scoped>
#wrapper {
    display: block;
    height: 100vh;
    position: relative
}

#content {
    display: flex;

    justify-content: center;
    align-items: center;
    height: 80%;
}
</style>