
<script setup lang="ts">
const props = defineProps({
    type: {
        type: String,
        default: 'spinner'
    },
    progress: Number,
    show: {
        type: Boolean,
        default: true
    }
})

</script>


<template >
    <div id="wrapper" v-if="show">
        <div id="content">

            <scale-loading-spinner v-if="props.type == 'spinner'" size="large" text="Loading ..."></scale-loading-spinner>

            <scale-progress-bar v-if="props.type == 'progressbar'" :percentage="props.progress"
                id="progress-bar"></scale-progress-bar>


            <!-- Logging text -->

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

#progress-bar {
    width: 500px;
}
</style>