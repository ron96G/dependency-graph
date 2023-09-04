import { LATEST_VALUE } from "@/constants";
import { SemVer, findLastIndexOfOperator, isOperator, type Operators } from "../semver";



export interface SearchItem {
    operator: Operators,
    version: SemVer | LATEST_VALUE
}

export class Search {

    public patterns: Array<string> = []
    public versions: Array<SearchItem> = []

    mergePatterns = () => {
        if (this.patterns.length == 0) return;

        let re = ".*("
        for (const pattern of this.patterns) {
            re += `${pattern}|`
        }
        re = re.slice(0, re.length - 1)
        re += ").*"

        this.patterns = [re]
    }

    constructor(raw: string) {
        const parts = raw.split(" ")
        for (const part of parts) {
            const splitIdx = findLastIndexOfOperator(part)

            if (splitIdx >= 0) {
                // version search
                const item = {} as SearchItem

                const operator = part.substring(0, splitIdx + 1)
                const version = part.substring(splitIdx + 1)

                if (!isOperator(operator)) {
                    throw Error(`Invalid input '${operator}' is not valid`)
                }

                if (operator == "==" && version === LATEST_VALUE) {
                    item.operator = operator
                    item.version = version

                } else if (version === LATEST_VALUE) {
                    throw Error(`Invalid input '${version}' can only be used with operator '=='`)

                } else {
                    if (!SemVer.isValidSemver(version)) {
                        throw Error(`Invalid input '${version}' is not a valid semver`)
                    }

                    item.operator = operator;
                    item.version = new SemVer(version)
                }

                this.versions.push(item)

            } else {
                // pattern search
                this.patterns.push(part)
            }
        }

        this.mergePatterns()
    }
}