
export type CompareFunc = (other: SemVer, includePrefix?: boolean) => boolean;

const ALL_OPERATORS = ["==", "!=", "=!", "=>", ">=", "<=", "=<", ">", "<"]
export type Operators = "==" | "!=" | "=!" | "=>" | ">=" | "<=" | "=<" | ">" | "<";

export const isOperator = (str: string): str is Operators => {
    return ALL_OPERATORS.includes(str)
}

export const findLastIndexOfOperator = (str: string) => {
    for (const operator of ALL_OPERATORS) {
        if (str.includes(operator)) {
            let idxChar = operator
            if (operator.length > 1) {
                idxChar = operator[1]
            }
            return str.lastIndexOf(idxChar)
        }
    }
    return -1
}

export type OperatorStrings = "isEqualTo" | "isNotEqualTo" | "isGreaterOrEqualTo" | "isSmallerOrEqualTo" | "isGreaterThan" | "isSmallerThan"

export const compareOperationsMap: Record<Operators, OperatorStrings> = {
    "==": "isEqualTo",
    "!=": "isNotEqualTo",
    "=!": "isNotEqualTo",
    "=>": "isGreaterOrEqualTo",
    ">=": "isGreaterOrEqualTo",
    "<=": "isSmallerOrEqualTo",
    "=<": "isSmallerOrEqualTo",
    ">": "isGreaterThan",
    "<": "isSmallerThan",
} as const;

export class SemVer implements Record<OperatorStrings, CompareFunc> {

    private static readonly RE = /^[0-9]+\.[0-9]+\.[0-9]+(\S+)?$/
    prefix: string
    major = 0
    minor = 0
    patch = 0

    constructor(str: string, prefix?: string) {
        this.prefix = prefix || ""
        if (this.prefix != "") str = str.substring(this.prefix.length)

        const parts = str.split(".")
        if (parts.length > 0) this.major = Number(parts[0])
        if (parts.length > 1) this.minor = Number(parts[1])
        if (parts.length > 2) this.patch = Number(parts[2])
    }

    toString = (includePrefix = true) => {
        return `${includePrefix ? this.prefix : ""}${this.major}.${this.minor}.${this.patch}`
    }

    static isValidSemver = (str: string) => {
        const match = str?.match(SemVer.RE)
        return match && str === match[0]
    }

    isGreaterThan: CompareFunc = (other: SemVer) => {
        if (this.major != other.major) return this.major > other.major
        if (this.minor != other.major) return this.minor > other.minor
        if (this.patch != other.patch) return this.patch > other.patch
        return false
    }

    isSmallerThan: CompareFunc = (other: SemVer) => {
        return !this.isGreaterThan(other)
    }

    isEqualTo: CompareFunc = (other: SemVer, includePrefix = true) => {
        return this.toString(includePrefix) === other.toString(includePrefix)
    }

    isNotEqualTo: CompareFunc = (other: SemVer, includePrefix = true) => {
        return !this.isEqualTo(other, includePrefix)
    }

    isGreaterOrEqualTo: CompareFunc = (other: SemVer, includePrefix = true) => {
        return this.isGreaterThan(other) || this.isEqualTo(other, includePrefix)
    }

    isSmallerOrEqualTo: CompareFunc = (other: SemVer, includePrefix = true) => {
        return this.isSmallerThan(other) || this.isEqualTo(other, includePrefix)
    }

    static compare = (left: SemVer, operator: Operators, right: SemVer) => {
        const strOperation: keyof SemVer = compareOperationsMap[operator]
        if (strOperation) {
            return (left[strOperation])(right)
        }
        return null
    }
}