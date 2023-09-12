<script setup lang="ts">

const mq = window.matchMedia('(prefers-color-scheme: dark)');
let isDark = mq.matches;

function switchMode() {
    document.body.dataset.mode = isDark ? 'light' : 'dark';
    isDark = !isDark
}
</script>



<template>
    <div id="light-dark-mode-switch-wrapper">
        <scale-icon-action-light-dark-mode id="light-dark-mode-switch" @click="switchMode" size="36"
            accessibility-title="switch-light-dark-mode">
        </scale-icon-action-light-dark-mode>
    </div>
</template>


<style scoped>
#light-dark-mode-switch-wrapper {
    position: relative;
    z-index: 99;
}

#light-dark-mode-switch {
    position: absolute;
    top: 0px;
    right: 0px;
    margin: 10px;
    cursor: pointer;
}
</style>