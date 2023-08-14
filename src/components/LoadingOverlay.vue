
<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps({
    type: {
        type: String,
        default: 'spinner'
    },
    progress: Number,
    show: {
        type: Boolean,
        default: true
    },
    logs: {
        type: Array<String>
    }
})

watch(() => props.logs, () => {
    const element = document.getElementById("log-stream")
    if (element) {
        element.scrollTop = element.scrollHeight
    }

}, {
    deep: true,
    immediate: true
})

</script>


<template >
    <div id="wrapper" v-if="show">
        <div id="content">

            <scale-loading-spinner v-if="props.type == 'spinner'" size="large" text="Loading ..."
                id="spinner"></scale-loading-spinner>

            <scale-progress-bar v-if="props.type == 'progressbar'" :percentage="props.progress"
                id="progress-bar"></scale-progress-bar>

            <div id="log-stream">
                <template v-for="msg in logs">
                    <p id="log-entry">{{ msg }}</p>
                </template>
            </div>
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
    justify-content: center;
    align-items: center;
    height: 80%;

    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    grid-template-areas:
        "header"
        "main"
        "footer";
}

#spinner {
    grid-area: header;
}

#progress-bar {
    width: 20vw;
    grid-area: main;
    align-self: end;
    margin: auto;
}

#log-stream {
    align-self: start;
    padding-top: 20px;
    grid-area: footer;
    height: 20vh;
    width: 30vw;
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
    overflow: auto;
}

#log-entry {
    padding-left: 10px;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--telekom-color-ui-faint);
    border-radius: 1ch;
}

::-webkit-scrollbar-thumb {
    background: var(--telekom-color-ui-regular);
    border-radius: 1ch;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--telekom-color-text-and-icon-primary-standard);
}
</style>