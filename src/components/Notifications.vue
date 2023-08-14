<script setup lang="ts">

function showMenu() {
    console.log("CLICKED")
}
</script>



<template>
    <div id="content">
        <scale-icon-action-notification id="content-item" @click="showMenu" size="36" accessibility-title="notifications">
        </scale-icon-action-notification>

        <scale-icon-alert-warning id="content-item" @click="showMenu" size="36" accessibility-title="warnings">
        </scale-icon-alert-warning>

        <scale-icon-alert-error id="content-item" @click="showMenu" size="36" accessibility-title="errors">
        </scale-icon-alert-error>
    </div>
</template>


<style scoped>
#content {
    position: relative;
    z-index: 98;
    justify-content: flex-end;
    float: right;
    display: grid;
    padding-top: 10vh;
}

#content-item {
    margin: 10px;
    cursor: pointer;
    position: grid;
}
</style>