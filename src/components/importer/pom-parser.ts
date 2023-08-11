import type { IModuleInfo, IPOMInfo } from "./types";

export class POMInfo implements IPOMInfo {
    public packaging: string;
    public info: ModuleInfo;
    public parent: ModuleInfo;
    public dependencies: ModuleInfo[];

    constructor() {
        this.packaging = "unknown"
        this.info = new ModuleInfo()
        this.parent = new ModuleInfo()
        this.dependencies = []
    }
}

export class ModuleInfo implements IModuleInfo {
    groupId: string
    artifactId: string
    version: string

    constructor(groupId?: string, artifactId?: string, version?: string) {
        this.groupId = groupId || "unknown";
        this.artifactId = artifactId || "unknown";
        this.version = version || "unknown";
    }
}

export class POMParser {
    private static parser = new DOMParser();
    private readonly xmlDoc: Document;

    public subModulesNames: string[]
    public properties: Map<string, string>;
    public info: POMInfo;


    constructor(rawXML: string) {
        this.xmlDoc = POMParser.parser.parseFromString(rawXML, "text/xml")
        this.subModulesNames = this.getModules()
        this.properties = this.getProperties()

        this.info = new POMInfo()
        this.info.packaging = this.getRootValue("packaging") || "unknown"
        this.info.info = this.getInfo()
        this.info.parent = this.getParentInfo()
        this.info.dependencies = this.getDependencies()
    }

    private parseRawModuleInfo = (element: Element): ModuleInfo => {
        const info = new ModuleInfo()

        for (const child of element.childNodes) {
            if (child.nodeName.startsWith("#")) continue
            if (child.nodeName === "groupId") info.groupId = this.resolveFromProperties(child.textContent);
            if (child.nodeName === "artifactId") info.artifactId = this.resolveFromProperties(child.textContent);
            if (child.nodeName === "version") info.version = this.resolveFromProperties(child.textContent);
        }
        return info;
    }

    private resolveFromProperties = (key: string | null | undefined, def = "unknown"): string => {
        if (!key) return def
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
        for (const property of properties) {
            for (const child of property.childNodes) {
                if (child.nodeName.startsWith("#")) continue
                propertyMap.set(child.nodeName, child.textContent)
            }
        }
        return propertyMap;
    }

    private getRootValue = (name: string, ensure = false, def = "unknown") => {
        const elements = this.xmlDoc.getElementsByTagName(name)

        if (elements.length == 0) {
            if (!ensure) return def
        }
        for (const element of elements) {
            if (element.parentNode?.nodeName === "project") {
                return element.textContent || def
            }
        }
        return def
    }

    getParentInfo = (): IModuleInfo => {
        const parent = this.xmlDoc.getElementsByTagName('parent')
        if (parent.length != 1) {
            return new ModuleInfo()
        }
        return this.parseRawModuleInfo(parent[0]);
    }

    getModules = (): string[] => {
        const foundModules = []
        const element = this.xmlDoc.getElementsByTagName('modules')
        if (element.length != 1) {
            return []
        }
        for (const child of element[0].childNodes) {
            if (child.nodeName.startsWith("#")) continue
            if (child.textContent)
                foundModules.push(child.textContent)
        }

        return foundModules
    }

    getDependencies = (): IModuleInfo[] => {
        const moduleInfos: ModuleInfo[] = []
        const dependencies = this.xmlDoc.getElementsByTagName('dependency')
        for (const dependency of dependencies) {
            moduleInfos.push(this.parseRawModuleInfo(dependency))
        }
        return moduleInfos;
    }

    getInfo = (): IModuleInfo => {
        return new ModuleInfo(
            this.getRootValue("groupId"),
            this.getRootValue("artifactId"),
            this.getRootValue("version"),
        )
    }
}
