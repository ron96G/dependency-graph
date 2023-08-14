<script setup lang="ts">

const mq = window.matchMedia('(prefers-color-scheme: dark)');
let isDark = mq.matches;

function switchMode() {
    document.body.dataset.mode = isDark ? 'light' : 'dark';
    isDark = !isDark
}
</script>



<template>
    <div id="content">
        <scale-icon-action-light-dark-mode id="content-item" @click="switchMode" size="36"
            accessibility-title="switch-light-dark-mode">
        </scale-icon-action-light-dark-mode>
    </div>
</template>


<style scoped>
#content {
    position: relative;
    z-index: 99;
}

#content-item {
    position: absolute;
    top: 0px;
    right: 0px;
    margin: 10px;
    cursor: pointer;
}
</style>