<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
    inErrors: {
        type: Array<string>,
        default: []
    },
    inWarnings: {
        type: Array<string>,
        default: []
    },
    inNotifications: {
        type: Array<string>,
        default: []
    }
})

const errors = computed(() => props.inErrors)
const warnings = computed(() => props.inWarnings)
const notifications = computed(() => props.inNotifications)

function showMenu() {
    console.log(notifications.value)
    console.log(warnings.value)
    console.log(errors.value)
}
</script>



<template>
    <div id="content">
        <div id="sidebar">
            <div class="content-item">
                <label v-if="notifications.length > 0" for="notifications" class="content-item-label">
                    {{ notifications.length }}
                </label>
                <scale-icon-action-notification id="notifications" class="content-item-icon" @click="showMenu" size="36"
                    accessibility-title="notifications" variant="informational" v-bind:style="notifications.length > 0 ? {
                        color: 'var(--telekom-color-text-and-icon-on-subtle-green)'
                    } : {
                        color: 'var(--telekom-color-text-and-icon-standard)'
                    }">
                </scale-icon-action-notification>
            </div>

            <div class="content-item">
                <label v-if="warnings.length > 0" for="warnings" class="content-item-label">
                    {{ warnings.length }}
                </label>
                <scale-icon-alert-warning id="warnings" class="content-item-icon" @click="showMenu" size="36"
                    accessibility-title="warnings" variant="warning" v-bind:style="warnings.length > 0 ? { color: 'var(--telekom-color-text-and-icon-functional-warning)' } : {
                        color: 'var(--telekom-color-text-and-icon-standard)'
                    }">
                </scale-icon-alert-warning>
            </div>

            <div class="content-item">
                <label v-if="errors.length > 0" for="errors" class="content-item-label">
                    {{ errors.length }}
                </label>
                <scale-icon-alert-error id="errors" class="content-item-icon" @click="showMenu" size="36"
                    accessibility-title="errors" variant="danger" v-bind:style="errors.length > 0 ? { color: 'var(--telekom-color-text-and-icon-functional-danger)' } : {
                        color: 'var(--telekom-color-text-and-icon-standard)'
                    }">
                </scale-icon-alert-error>
            </div>
        </div>
    </div>
</template>


<style scoped>
#content {
    position: relative;
    z-index: 98;
}

#sidebar {
    justify-content: flex-end;
    float: right;
    display: grid;
    padding-top: 10vh;
}

.content-item {
    margin: 10px;
    cursor: pointer;
    position: grid;
    display: block;
}

.content-item-label {
    display: block;
    position: absolute;
    font-size: 10px;
}
</style>