import { Gitlab } from '@gitbeaker/rest';
import { POMParser, UNKNOWN_VALUE } from './pom-parser';
import { GraphData } from './formatter';


export type Callback<T> = (payload: T) => void
export type EventType = 'projects:log' | 'projects:import' | 'projects:data'

export class EventEmitter<T> {
    callbackMap = new Map<EventType, Array<Callback<T>>>

    on(eventType: EventType, cb: Callback<T>) {
        if (!this.callbackMap.has(eventType)) {
            this.callbackMap.set(eventType, [])
        }
        this.callbackMap.get(eventType)?.push(cb)
    }

    emit(eventType: EventType, payload: T) {
        if (!this.callbackMap.has(eventType)) {
            return
        }
        const cbs = this.callbackMap.get(eventType)
        cbs?.forEach(cb => cb(payload))
    }
}

interface Event {
    message: string
    level: 'info' | 'warn' | 'error'
    [key: string]: any
}

export class GitlabHelper extends EventEmitter<Event> {
    private gitlab;
    private readonly host: string = "https://gitlab.devops.telekom.de";
    private token: string;
    private groupId: string;
    private ref: string = "main";

    public readonly limit;
    public readonly regex?: RegExp;

    constructor(accessToken: string, groupId: string, limit = 20, matchPattern?: string) {
        super();
        this.token = accessToken;
        this.groupId = groupId;
        this.limit = limit;
        if (matchPattern && matchPattern.length > 2) {
            this.regex = new RegExp(matchPattern)
        }
        this.gitlab = new Gitlab({
            host: this.host,
            token: this.token,
        })

    }

    private fetchFile(projectId: number, filePath: string, ensure = true) {
        try {
            return this.gitlab.RepositoryFiles.show(projectId, filePath, this.ref)
        } catch (e) {
            console.log(`Failed to fetch file`)
            if (ensure) {
                throw e
            } else {
                return null
            }
        }
    }

    getAll = async () => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        this.emit('projects:log', {
            message: `Only selecting projects which have been updated before ${date.toISOString()}`,
            level: 'info'
        })

        const allProjects = await this.gitlab.Groups.allProjects(this.groupId, {
            simple: true,
            includeSubgroups: true,
            sort: 'desc',
            pagination: 'offset',
            perPage: 10,
            orderBy: 'updated_at',
        })

        const selectedProjects = allProjects.filter(p => {
            const lastActivity = new Date(p.last_activity_at)
            if (lastActivity >= date) {
                return true
            }
            this.emit('projects:log', {
                message: `Ignored project '${p.name}' (${p.id}) due to inactivity (${lastActivity.toISOString()})'`,
                level: 'info'
            })
            return false
        })

        const pomFile = "pom.xml";
        const data = new GraphData()
        const limit = Math.min(selectedProjects.length, this.limit)
        let count = 1

        this.emit('projects:import', {
            message: `Start with import from gitlab`,
            level: 'info',
            max: limit,
            cur: count,
        })

        for (const projectSchema of selectedProjects) {
            const {
                name,
                id,
                http_url_to_repo
            } = projectSchema

            if (count >= limit + 1) {
                this.emit('projects:log', {
                    message: `Reached limit ${limit} with ${selectedProjects.length - limit} left`,
                    level: 'warn'
                })
                break
            }

            if (this.regex && !this.regex.test(name)) {
                console.log(`Ignored project '${name}' (${id}). Did not match regex`)
                continue
            }

            count++

            this.emit('projects:import', {
                message: `Imported project`,
                level: 'info',
                max: limit,
                cur: count,
            })

            this.emit('projects:log', {
                message: `Found project '${name}' (${id}). Access under '${http_url_to_repo}'`,
                level: 'info',
                id: id,
                name: name,
                http_url_to_repo: http_url_to_repo,
            })

            let rootPom;
            try {
                rootPom = await this.gitlab.RepositoryFiles.show(id, pomFile, this.ref)
            } catch (e) {
                this.emit('projects:log', {
                    message: `Failed to fetch pom file for project'${name}' (${id}).`,
                    level: 'warn'
                })
                continue // not a valid repo
            }

            const fileContent = atob(rootPom?.content);
            const pomInfoCollection = []
            const rootPomParser = new POMParser(fileContent);
            // pomInfoCollection.push(rootPomParser.info)

            const subPomCollection = await Promise.all(rootPomParser.subModulesNames.map(subModule => this.fetchFile(id, subModule + "/" + pomFile)))

            for (const subPom of subPomCollection) {
                if (subPom == null) continue
                const fileContent = atob(subPom?.content);
                const parser = new POMParser(fileContent, {
                    artifactId: rootPomParser.info.self?.artifactId || UNKNOWN_VALUE,
                    groupId: rootPomParser.info.self?.groupId || UNKNOWN_VALUE,
                    version: "latest"
                });
                pomInfoCollection.push(parser.info)
            }

            data.inject(...pomInfoCollection)

            this.emit('projects:data', {
                message: `Imported project`,
                level: 'info',
                data: data,
            })


        }
        return data;
    }
}
