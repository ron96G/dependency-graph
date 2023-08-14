<script setup lang="ts">
import { onMounted } from 'vue';
import { GitlabHelper } from './gitlab-helper';

const emit = defineEmits(['progress', 'finished', 'data', 'logs'])

let accessToken = ""
let groupId = ""
let matchPattern = ""
let limit = 50

function validateInput() {
    if (!groupId || groupId == "") {
        return {
            elementId: "input-group-id",
            message: "Group ID is a required field"
        }
    }
}

async function startImport(e: any) {
    const valRes = validateInput()
    if (valRes) {
        const element = document.getElementById(valRes.elementId)
        element?.setAttribute("invalid", "")
        element?.setAttribute("helper-text", valRes.message)
        return
    }

    const gitlabHelper = new GitlabHelper(accessToken, groupId, limit, matchPattern)
    emit('progress', 0)

    gitlabHelper.on('projects:import', (payload) => {
        const progress = Math.round(payload.cur / payload.max * 100)
        emit('progress', progress)
    })

    gitlabHelper.on('projects:log', (payload) => {
        emit('logs', payload.message)
    })

    gitlabHelper.on('projects:data', (payload) => {
        emit('data', payload.data)
    })

    try {
        await gitlabHelper.getAll()
        emit('finished')

    } catch (err) {
        emit('finished', err)
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


onMounted(() => {
    const latestGraph = localStorage.getItem("latest-graph")
    if (latestGraph) {
        emit('data', JSON.parse(latestGraph))
        emit('finished')
    }
})
</script>



<template>
    <div id="wrapper">
        <div id="content">
            <h1 class="content-item">Import Gitlab Repositories</h1>
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
        </div>
    </div>
</template>


<style scoped>
#wrapper {
    display: block;
    position: relative;
}

#content {
    align-content: center;
    justify-content: center;
    height: 100vh;
    position: relative;
    display: grid;
}

#content-footer {
    margin: 5px;
    align-content: center;
    display: flex;
}

.content-item {
    width: 20vw;
    margin: 5px auto;
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
</style>