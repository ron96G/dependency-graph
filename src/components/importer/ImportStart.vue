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
    if (!gitlabHost || gitlabHost.value == "") {
        ret.push({
            elementId: "input-gitlab-host",
            message: "Gitlab Host is a required field"
        })
    }

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
        try {
            const text = await uploadedFile.text()
            const json = JSON.parse(text)
            emit('data', json)
            emit('finished')
        } catch (e) {
            emit('errors', {
                level: 'error',
                message: e
            })
        }

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
    <div id="import-wrapper">
        <ul id="content">
            <li class="content-item">
                <scale-card class="card" style="grid-column-start: 2; grid-row-start: 2;">
                    <h4 class="card-header">Import Gitlab Repositories </h4>

                    <scale-text-field id="input-gitlab-host" label="Gitlab Host" v-model="gitlabHost"
                        @keyup.enter="startImport"></scale-text-field>

                    <scale-text-field id="input-access-token" label="Access Token" type="password" v-model="accessToken"
                        @keyup.enter="startImport"></scale-text-field>

                    <scale-text-field id="input-group-id" label="Group ID" v-model="groupId" required
                        @keyup.enter="startImport"></scale-text-field>

                    <scale-text-field id="input-project-matcher" label="Project Pattern" v-model="matchPattern"
                        @keyup.enter="startImport"></scale-text-field>

                    <div class="card-footer">
                        <scale-button class="card-footer-item" @click="startImport"> Go </scale-button>

                        <label for="file-upload" class="card-footer-item">
                            Upload
                        </label>
                        <input type="file" class="card-footer-item" id="file-upload" @change="uploadFile">
                    </div>
                </scale-card>
            </li>
            <li class="content-item">
                <scale-card class="card" v-if="presets.length > 0" style="grid-column-start: 2; grid-row-start: 3;">
                    <h4 class="card-header">Reuse preset </h4>
                    <div id="table-wrapper">
                        <a class="table-item" v-for="preset in presets" :key="preset.name" @click="selectPreset(preset)">
                            {{ preset.name }}
                        </a>
                    </div>
                </scale-card>
            </li>
        </ul>
    </div>
</template>


<style scoped>
#import-wrapper {
    max-width: 1200px;
    margin: auto;
    position: relative;
    top: 10rem;
}

@media only screen and (max-width: 700px) {
    #import-wrapper {
        top: 0;
    }
}

#content {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
    justify-content: center;
}

.content-item {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

@media (min-width: 40rem) {
    .content-item {
        width: 50%;
    }
}


@media (min-width: 56rem) {
    .content-item {
        width: 33.3333%;
    }
}

.card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 300px;
}

.card-header {
    font: var(--telekom-text-style-heading-4);
    margin: 0px 0 16px 0;
}

.card-footer {
    margin: 5px;
    align-content: center;
    display: flex;
}

.card-footer-item {
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