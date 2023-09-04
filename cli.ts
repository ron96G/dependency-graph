import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'node:util'

import { DOMParser } from 'xmldom';
import { POMParser } from './src/libs/importer/pom-parser'
import { GraphData } from './src/libs/importer/formatter'
import { GitlabHelper } from './src/libs/importer/gitlab-helper';

const OUTPUT_DIR = "public/presets"
const INDEX_FILE = path.join(OUTPUT_DIR, "index.json")

const domParser = new DOMParser()
POMParser.parser = domParser;

const fail = (reason: string) => {
    console.log(reason)
    process.exit(1)
}

const required = <T = any>(name: string, val: T | undefined): T => {
    if (val === undefined || !val) {
        fail(`Required value '${name}' not set.`)
    }
    return val as T
}

const find = (root: string, re: RegExp, target: Array<string> = []) => {
    if (!fs.existsSync(root)) {
        throw new Error(`Path does not exist`)
    }
    const stat = fs.lstatSync(root)
    if (stat.isFile()) {
        if (re.test(root)) {
            target.push(root)
        }
        return target
    }
    const files = fs.readdirSync(root)
    for (const file of files) {
        const fullpath = path.join(root, file)
        const stat = fs.lstatSync(fullpath)
        if (stat.isDirectory()) {
            target = target.concat(find(fullpath, re))
        } else {
            if (re.test(fullpath)) {
                target.push(fullpath)
            }
        }
    }
    return target
}

const writeToFs = (data: GraphData, path: string) => {
    const output = JSON.stringify({
        nodes: data.nodes,
        edges: data.edges
    })
    fs.writeFileSync(path, output)
}

const argsValues = () => (parseArgs({
    options: {
        name: {
            type: 'string'
        },
        type: {
            type: 'string',
            default: 'local'
        },
        path: {
            type: 'string'
        },
        host: {
            type: 'string',
        },
        gid: {
            type: 'string'
        },
    }
}).values)

const runLocal = async (name: string, filepath: string) => {
    const root = path.dirname(filepath)
    const data = new GraphData()
    const allPoms = find(filepath, new RegExp('.*pom\.xml'))
    for (const pomFile of allPoms) {
        const content = fs.readFileSync(pomFile, 'utf-8')
        const rootPomParser = new POMParser(domParser.parseFromString(content))

        for (const moduleName of rootPomParser.subModulesNames) {
            const content = fs.readFileSync(path.join(root, moduleName, "pom.xml"), 'utf-8')
            const pomParser = new POMParser(domParser.parseFromString(content))
            data.inject(pomParser.info)
        }

    }

    writeToFs(data, path.join(OUTPUT_DIR, name + ".json"))
}

const runGitlab = async (name: string, host: string, gid: string, token: string) => {
    const gitlabHelper = new GitlabHelper(required("host", host), token, required("gid", gid), 50)
    const data = await gitlabHelper.getAll()

    writeToFs(data, path.join(OUTPUT_DIR, name + ".json"))
}

const ensureIndexFile = () => {
    if (fs.existsSync(INDEX_FILE)) {
        const f = fs.readFileSync(INDEX_FILE, 'utf8')
        return JSON.parse(f)
    } else {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR)
        }
        return []
    }
}

const main = async () => {
    let indexData: Array<{ name: string, href: string }> = ensureIndexFile();
    let { type, name, path, host, gid } = argsValues()
    name = required("name", name)

    if (type === 'local') {
        runLocal(name, required("path", path))

    } else if (type === 'gitlab') {
        const token = required("GITLAB_TOKEN", process.env.GITLAB_TOKEN)
        runGitlab(name, required("host", host), required("gid", gid), token)

    } else {
        console.log('Invalid type. Only [local, gitlab] allowed')
    }

    indexData = indexData.filter(i => i.name !== name)

    indexData.push({
        name: name,
        href: `${OUTPUT_DIR}/${name}.json`
    })

    fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData))
}


main().then().catch()