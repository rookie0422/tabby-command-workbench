export const CONFIG_KEY = 'commandWorkbench'
export const LEGACY_CONFIG_KEY = 'serialCommandSidebar'

function hasPersistedValue (value: any): boolean {
    if (value === undefined || value === null) {
        return false
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value).length > 0
    }
    return true
}

export function selectPersistedConfig (raw: any, fallback: any): any {
    // ConfigProxy creates an empty object for structural defaults before the
    // service runs. That placeholder must not outrank real legacy data.
    if (hasPersistedValue(raw?.[CONFIG_KEY])) {
        return raw[CONFIG_KEY]
    }
    if (hasPersistedValue(raw?.[LEGACY_CONFIG_KEY])) {
        return raw[LEGACY_CONFIG_KEY]
    }
    return fallback
}
