<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';
import { GitlabHelper } from '@/libs/importer/gitlab-helper';
import { STORAGE_KEY_GITLAB_HOST, STORAGE_KEY_LATEST_GRAPH } from '@/constants'

const emit = defineEmits(['progress', 'finished', 'data', 'logs', 'errors'])

let gitlabHost = ref("")
let accessToken = ""
let groupId = ""
let matchPattern = ""
let limit = 50

interface PresetItem { name: string, href: string }

let presets: Ref<Array<PresetItem>> = ref([])

function validateInput() {
    const ret = []
    if (!accessToken || accessToken == "") {
        ret.push({
            elementId: "input-access-token",
            message: "Access Token is a required field"
        })
    }

    if (!groupId || groupId == "") {
        ret.push({
            elementId: "input-group-id",
            message: "Group ID is a required field"
        })
    }

    return ret
}

async function startImport() {
    localStorage.setItem(STORAGE_KEY_GITLAB_HOST, gitlabHost.value)

    const valRes = validateInput()
    if (valRes && valRes.length > 0) {
        for (const val of valRes) {
            const element = document.getElementById(val.elementId)
            element?.setAttribute("invalid", "")
            element?.setAttribute("helper-text", val.message)
        }
        return
    }

    let gitlabHelper;

    try {
        gitlabHelper = new GitlabHelper(gitlabHost.value, accessToken, groupId, limit, matchPattern)

    } catch (e) {
        emit('errors', {
            level: 'error',
            message: e
        })
        return
    }

    gitlabHelper.on('projects:import', (payload) => {
        const progress = Math.round(payload.cur / payload.max * 100)
        emit('progress', progress)
    })

    gitlabHelper.on('projects:log', (payload) => {
        if (payload.level == 'error') {
            emit('errors', payload)
        } else {
            emit('logs', payload)
        }

    })

    gitlabHelper.on('projects:data', (payload) => {
        emit('data', payload.data)
    })

    try {
        await gitlabHelper.getAll()
        emit('finished')

    } catch (e) {
        emit('errors', {
            level: 'error',
            message: e
        })
    }
}

async function uploadFile(e: Event) {
    const files = (e.target as any)?.files as File[]
    if (files && files.length >= 1) {
        const uploadedFile = files[0]
        const text = await uploadedFile.text()
        const json = JSON.parse(text)
        emit('data', json)
        emit('finished')
    }
}

async function fetchPresets(): Promise<Array<PresetItem>> {
    const res = await fetch('presets/index.json')
    if (res.status === 200) {
        return res.json()
    }
    return []
}

async function selectPreset(item: PresetItem) {
    const res = await fetch(item.href)
    if (res.status === 200) {
        emit('data', await res.json())
        emit('finished')
    } else {
        emit('errors', {
            level: 'error',
            message: `failed to fetch preset ${item.name} (${item.href})`
        })
    }
}

onMounted(async () => {
    const storedGitlabHost = localStorage.getItem(STORAGE_KEY_GITLAB_HOST)
    if (storedGitlabHost) {
        gitlabHost.value = storedGitlabHost
    }


    const latestGraph = localStorage.getItem(STORAGE_KEY_LATEST_GRAPH)
    if (latestGraph) {
        emit('data', JSON.parse(latestGraph))
        emit('finished')
    } else {
        presets.value = await fetchPresets()
    }
})
</script>

<template>
    <div id="wrapper">
        <scale-card id="content" style="grid-column-start: 2; grid-row-start: 2;">
            <h4 class="content-item-header">Import Gitlab Repositories </h4>
            <scale-text-field class="content-item" id="input-gitlab-host" label="Gitlab Host" v-model="gitlabHost"
                @keyup.enter="startImport"></scale-text-field>

            <scale-text-field class="content-item" id="input-access-token" label="Access Token" type="password"
                v-model="accessToken" @keyup.enter="startImport"></scale-text-field>

            <scale-text-field class="content-item" id="input-group-id" label="Group ID" v-model="groupId" required
                @keyup.enter="startImport"></scale-text-field>

            <scale-text-field class="content-item" id="input-project-matcher" label="Project Pattern" v-model="matchPattern"
                @keyup.enter="startImport"></scale-text-field>

            <div id="content-footer">
                <scale-button class="content-footer-item" @click="startImport"> Go </scale-button>

                <label for="file-upload" class="content-footer-item">
                    Upload
                </label>
                <input type="file" class="content-footer-item" id="file-upload" @change="uploadFile">
            </div>
        </scale-card>

        <scale-card v-if="presets.length > 0" id="content" style="grid-column-start: 2; grid-row-start: 3;">
            <h4 class="content-item-header">Reuse preset </h4>
            <div id="table-wrapper">
                <a class="table-item" v-for="preset in presets" :key="preset.name" @click="selectPreset(preset)">
                    {{ preset.name }}
                </a>
            </div>
        </scale-card>
    </div>
</template>


<style scoped>
#wrapper {
    position: relative;
    display: grid;
    grid-template-columns: 35vw 30vw 35vw;
    grid-template-rows: 20vh 30vh 30vh 20vh;
}

#content {
    align-content: center;
    justify-content: center;
}

#content-footer {
    margin: 5px;
    align-content: center;
    display: flex;
}

.content-item {
    width: 20vw;
    font: var(--telekom-text-style-body);
}

.content-item-header {
    font: var(--telekom-text-style-heading-4);
    margin: 0px 0 16px 0;
}

.content-footer-item {
    margin: 5px 10px 5px 0;
}

label {
    cursor: pointer;
    display: block;
    box-sizing: border-box;
    height: 44px;
    color: var(--telekom-color-text-and-icon-white-standard);
    background-color: var(--telekom-color-primary-standard);
    border-radius: 1ch;
    padding: 10px 20px 5px 20px;
    font-size: var(--telekom-typography-font-size-body);
    font-weight: var(--telekom-typography-font-weight-bold);
}

#file-upload {
    opacity: 0;
    position: absolute;
    z-index: -1;
}

#table-wrapper {
    display: grid;
}

.table-item {
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 10px;
}

.table-item:hover {
    background-color: var(--telekom-color-ui-regular);

    border-radius: 15vw;
    font-weight: bold;
    cursor: pointer;
}
</style>