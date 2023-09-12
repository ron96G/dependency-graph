<script setup lang="ts">
import { computed, ref } from 'vue';

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

const modalHeading = ref("Notifications")
const modalIsOpened = ref(false);
const modalContent = ref<Array<{ message: string, level: string }>>([]);

function showMenu(t: 'errors' | 'warnings' | 'notifications') {
    if (t === 'errors') {
        modalHeading.value = 'Errors'
        modalContent.value = errors.value.map(msg => ({ 'message': msg, 'level': 'ERROR' }))
    }
    if (t === 'warnings') {
        modalHeading.value = 'Warnings'
        modalContent.value = warnings.value.map(msg => ({ 'message': msg, 'level': 'WARN' }))
    }
    if (t === 'notifications') {
        modalHeading.value = 'Notifications'
        modalContent.value = notifications.value.map(msg => ({ 'message': msg, 'level': 'INFO' }))
    }

    modalIsOpened.value = true;
}
</script>



<template>
    <div id="sidebar-wrapper">
        <div id="sidebar">
            <div class="content-item">
                <label v-if="notifications.length > 0" for="notifications" class="content-item-label">
                    {{ notifications.length }}
                </label>
                <scale-icon-action-notification id="notifications" class="content-item-icon"
                    @click="showMenu('notifications')" size="36" accessibility-title="notifications" variant="informational"
                    v-bind:style="notifications.length > 0 ? {
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
                <scale-icon-alert-warning id="warnings" class="content-item-icon" @click="showMenu('warnings')" size="36"
                    accessibility-title="warnings" variant="warning" v-bind:style="warnings.length > 0 ? { color: 'var(--telekom-color-text-and-icon-functional-warning)' } : {
                        color: 'var(--telekom-color-text-and-icon-standard)'
                    }">
                </scale-icon-alert-warning>
            </div>

            <div class="content-item">
                <label v-if="errors.length > 0" for="errors" class="content-item-label">
                    {{ errors.length }}
                </label>
                <scale-icon-alert-error id="errors" class="content-item-icon" @click="showMenu('errors')" size="36"
                    accessibility-title="errors" variant="danger" v-bind:style="errors.length > 0 ? { color: 'var(--telekom-color-text-and-icon-functional-danger)' } : {
                        color: 'var(--telekom-color-text-and-icon-standard)'
                    }">
                </scale-icon-alert-error>
            </div>
        </div>
    </div>

    <scale-modal :heading=modalHeading :opened="modalIsOpened" @scale-before-close="modalIsOpened = false">
        <table v-if="modalContent.length > 0">
            <tr>
                <th class="column-level">Level</th>
                <th class="column-message">Message</th>
            </tr>
            <template v-for="item in modalContent">
                <tr>
                    <td class="column-level"> {{ item.level }} </td>
                    <td class="column-message"> {{ item.message }} </td>
                </tr>
            </template>
        </table>
        <p v-else> No {{ modalHeading.toLowerCase() }} found. </p>
    </scale-modal>
</template>


<style scoped>
#sidebar-wrapper {
    position: relative;
    z-index: 98;
}

#notification-wrapper {
    position: relative;
    z-index: 98;
    background-color: blue;
}

table,
td,
th {
    border-spacing: 30px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

p {
    color: var(--telekom-color-ui-regular);
}

.column-level {
    text-align: start;
    padding-right: 10px;
    padding-left: 1px;
}

.column-message {
    text-align: start;
    padding-left: 1px;
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