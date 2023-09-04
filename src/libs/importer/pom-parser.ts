import type { IModuleInfo, IPOMInfo } from "./types";

export const UNKNOWN_VALUE = "unknown";

export class POMInfo implements IPOMInfo {
    public packaging: string;
    public self: IModuleInfo | null; // info about the current module
    public parent: IModuleInfo | null; // info about the parent of the current module
    public dependencies: IModuleInfo[]; // info about all dependencies of the current module

    constructor() {
        this.packaging = UNKNOWN_VALUE
        this.self = null
        this.parent = null
        this.dependencies = []
    }
}

export class ModuleInfo implements IModuleInfo {
    groupId: string
    artifactId: string
    version: string

    constructor(groupId: string, artifactId: string, version: string) {
        this.groupId = groupId;
        this.artifactId = artifactId;
        this.version = version;
    }

    toString = (): string => {
        return `${this.groupId}_${this.artifactId}_${this.version}`
    }
}

export class POMParser {
    public static parser: DOMParser;
    private readonly xmlDoc: Document;

    public subModulesNames: string[]
    public properties: Map<string, string>;
    public info: POMInfo;

    public defaults: IModuleInfo;

    constructor(xmlDoc: Document, defaults?: IModuleInfo | null) {
        this.xmlDoc = xmlDoc
        this.subModulesNames = this.getModules()
        this.properties = this.getProperties()

        this.defaults = defaults || new ModuleInfo(UNKNOWN_VALUE, UNKNOWN_VALUE, UNKNOWN_VALUE)
        this.info = new POMInfo()
        this.info.packaging = this.getRootValue("packaging") || UNKNOWN_VALUE
        this.info.self = this.getInfo()
        this.info.parent = this.getParentInfo()
        this.info.dependencies = this.getDependencies()
    }

    public static fromString(rawXML: string, defaults?: IModuleInfo | null) {
        if (POMParser.parser === undefined) {
            POMParser.parser = new DOMParser();
        }
        return new POMParser(POMParser.parser.parseFromString(rawXML, "text/xml"), defaults)
    }
    private parseRawModuleInfo = (element: Element): ModuleInfo => {
        const info = new ModuleInfo(this.defaults.groupId, this.defaults.artifactId, this.defaults.version)

        for (const child of Array.from(element.childNodes)) {
            if (child.nodeName.startsWith("#")) continue
            if (child.nodeName === "groupId")
                info.groupId = this.resolveFromProperties(child.textContent, this.defaults.groupId);
            if (child.nodeName === "artifactId")
                info.artifactId = this.resolveFromProperties(child.textContent, this.defaults.artifactId);
            if (child.nodeName === "version")
                info.version = this.resolveFromProperties(child.textContent, this.defaults.version);
        }
        return info;
    }

    private resolveFromProperties = (key?: string | null, def = UNKNOWN_VALUE): string => {
        if (!key) return def
        key = key.trim()
        if (!key.startsWith("${")) return key

        const cleanKey = key.replace("${", "").replace("}", "")
        if (this.properties.has(cleanKey)) {
            return this.properties.get(cleanKey)!
        }
        return def;
    }

    private getProperties = (): Map<string, string> => {
        const propertyMap = new Map();
        const properties = this.xmlDoc.getElementsByTagName('properties')
        for (const property of Array.from(properties)) {
            for (const child of Array.from(property.childNodes)) {
                if (child.nodeName.startsWith("#")) continue
                propertyMap.set(child.nodeName, child.textContent)
            }
        }
        return propertyMap;
    }

    private getRootValue = (name: string, ensure = false, def = UNKNOWN_VALUE) => {
        const elements = this.xmlDoc.getElementsByTagName(name)

        if (elements.length == 0) {
            if (!ensure) return def
        }
        for (const element of Array.from(elements)) {
            if (element.parentNode?.nodeName === "project") {
                return element.textContent || def
            }
        }
        return def
    }

    getParentInfo = (): IModuleInfo | null => {
        const parent = this.xmlDoc.getElementsByTagName('parent')
        if (parent.length != 1) {
            console.log(`Module ${this.info.self?.toString()} has no parent`)
            return null
        }
        return this.parseRawModuleInfo(parent[0]);
    }

    getModules = (): string[] => {
        const foundModules = []
        const element = this.xmlDoc.getElementsByTagName('modules')
        if (element.length != 1) {
            return []
        }
        for (const child of Array.from(element[0].childNodes)) {
            if (child.nodeName.startsWith("#")) continue
            if (child.textContent)
                foundModules.push(child.textContent)
        }

        return foundModules
    }

    getDependencies = (): IModuleInfo[] => {
        const moduleInfos: ModuleInfo[] = []
        const dependencies = this.xmlDoc.getElementsByTagName('dependency')
        for (const dependency of Array.from(dependencies)) {
            moduleInfos.push(this.parseRawModuleInfo(dependency))
        }
        return moduleInfos;
    }

    getInfo = (): IModuleInfo => {
        return new ModuleInfo(
            this.getRootValue("groupId", false, this.defaults.groupId),
            this.getRootValue("artifactId", false, this.defaults.artifactId),
            this.getRootValue("version", false, this.defaults.version),
        )
    }
}
