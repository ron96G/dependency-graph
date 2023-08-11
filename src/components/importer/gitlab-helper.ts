import { Gitlab } from '@gitbeaker/rest';
import { POMParser } from './pom-parser';
import { GraphData } from './formatter';

export class GitlabHelper {
    private gitlab;
    private readonly host: string = "https://gitlab.devops.telekom.de";
    private token: string;
    private groupId: string;
    private ref: string = "main";

    public readonly limit;
    public readonly regex?: RegExp;

    constructor(accessToken: string, groupId: string, limit = 20, matchPattern?: string) {
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
        console.log(`Only selecting projects which have been updated before ${date.toISOString()}`)

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
            console.log(`Ignored project '${p.name}' (${p.id}) due to inactivity (${lastActivity.toISOString()})'`)
            return false
        })

        const pomFile = "pom.xml";
        const data = new GraphData()

        let count = 1
        for (const projectSchema of selectedProjects) {
            const {
                name,
                id,
                http_url_to_repo
            } = projectSchema

            if (count >= this.limit + 1) {
                console.log(`Reached limit ${this.limit} with ${selectedProjects.length - this.limit} left`)
                break
            }

            if (this.regex && !this.regex.test(name)) {
                console.log(`Ignored project '${name}' (${id}). Did not match regex`)
                continue
            }

            console.log(`(${count}/${this.limit}) Found project '${name}' (${id}). Access under '${http_url_to_repo}'`)

            let rootPom;
            try {
                rootPom = await this.gitlab.RepositoryFiles.show(id, pomFile, this.ref)
            } catch (e) {
                console.log(`Failed to fetch pom file`)
                continue // not a valid repo
            }

            const fileContent = atob(rootPom?.content);
            const pomInfoCollection = []
            const parser = new POMParser(fileContent);
            pomInfoCollection.push(parser.info)

            const subPomCollection = await Promise.all(parser.subModulesNames.map(subModule => this.fetchFile(id, subModule + "/" + pomFile)))

            for (const subPom of subPomCollection) {
                if (subPom == null) continue
                const fileContent = atob(subPom?.content);
                const parser = new POMParser(fileContent);
                pomInfoCollection.push(parser.info)
            }

            data.inject(...pomInfoCollection)


            count++
        }
        return data;
    }
}