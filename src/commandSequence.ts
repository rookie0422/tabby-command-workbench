import { MAX_SEQUENCE_DELAY_MS, MAX_SEQUENCE_STEPS } from './constants'

export interface CommandStep {
    type: 'command'
    text: string
}

export interface DelayStep {
    type: 'delay'
    ms: number
}

export type SequenceStep = CommandStep | DelayStep

export interface SequenceParseResult {
    steps: SequenceStep[]
    errors: string[]
}

export interface DangerousMatch {
    label: string
    match: string
}

interface DangerousPattern {
    label: string
    pattern: RegExp
}

const PARAMETER_PATTERN = /\{\{\s*([a-zA-Z_][\w-]*)\s*\}\}/g
const DELAY_PATTERN = /^\{\{\s*delay\s*(?::|\s)\s*(\d+(?:\.\d+)?)(ms|s)?\s*\}\}$/i
const MAYBE_DELAY_PATTERN = /^\{\{\s*delay\b/i

const DANGEROUS_PATTERNS: DangerousPattern[] = [
    { label: 'reboot', pattern: /(?:^|[\s;&|])(?:adb\s+)?reboot(?:\s|$)/i },
    { label: 'rm', pattern: /(?:^|[\s;&|])rm\s+/i },
    { label: 'fastboot flash', pattern: /(?:^|[\s;&|])fastboot\s+flash(?:\s|$)/i },
    { label: 'fastboot erase', pattern: /(?:^|[\s;&|])fastboot\s+erase(?:\s|$)/i },
    { label: 'pm clear', pattern: /(?:^|[\s;&|])pm\s+clear(?:\s|$)/i },
    { label: 'factory reset', pattern: /factory\s+reset/i },
]

export function extractTemplateParameters (text: string): string[] {
    const names: string[] = []
    const seen = new Set<string>()
    const pattern = new RegExp(PARAMETER_PATTERN)
    let match: RegExpExecArray | null = pattern.exec(text)
    while (match) {
        const name = match[1]
        if (!seen.has(name)) {
            seen.add(name)
            names.push(name)
        }
        match = pattern.exec(text)
    }
    return names
}

export function renderTemplate (text: string, values: Record<string, string>): string {
    return text.replace(PARAMETER_PATTERN, (_, name: string) => values[name] ?? '')
}

export function stripDelaySteps (text: string): string {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    return normalized
        .split('\n')
        .filter(line => !DELAY_PATTERN.test(line.trim()))
        .join('\n')
}

export function hasDelayStep (text: string): boolean {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .some(line => DELAY_PATTERN.test(line.trim()))
}

export function parseCommandSequence (text: string): SequenceParseResult {
    const steps: SequenceStep[] = []
    const errors: string[] = []
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

    for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) {
            continue
        }
        const delay = DELAY_PATTERN.exec(line)
        if (delay) {
            const amount = Number(delay[1])
            const unit = (delay[2] || 'ms').toLowerCase()
            const ms = unit === 's' ? amount * 1000 : amount
            if (!Number.isFinite(ms) || ms < 0 || ms > MAX_SEQUENCE_DELAY_MS) {
                errors.push(`延迟必须在 0-${MAX_SEQUENCE_DELAY_MS}ms 之间：${line}`)
            } else {
                steps.push({ type: 'delay', ms: Math.round(ms) })
            }
            continue
        }
        if (MAYBE_DELAY_PATTERN.test(line)) {
            errors.push(`无法识别的 delay 语法：${line}`)
            continue
        }
        steps.push({ type: 'command', text: rawLine })
    }

    if (steps.length > MAX_SEQUENCE_STEPS) {
        errors.push(`命令序列最多支持 ${MAX_SEQUENCE_STEPS} 步`)
    }

    return { steps, errors }
}

export function findDangerousCommands (text: string): DangerousMatch[] {
    const matches: DangerousMatch[] = []
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    for (const pattern of DANGEROUS_PATTERNS) {
        const match = pattern.pattern.exec(normalized)
        if (match) {
            matches.push({
                label: pattern.label,
                match: match[0].trim(),
            })
        }
    }
    return matches
}

export function hasDangerousCommand (text: string): boolean {
    return findDangerousCommands(text).length > 0
}
