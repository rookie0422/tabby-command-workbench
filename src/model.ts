import {
    CommandSidebarPluginConfig,
    CommonCommand,
    LegacyCommandSidebarPluginConfig,
    QuickButtonCommand,
    QuickCategory,
    TempSnippet,
} from './types'
import { DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from './constants'

const now = (): number => Date.now()

export function createId (prefix: string): string {
    return `${prefix}-${now()}-${Math.random().toString(16).slice(2)}`
}

function quick (
    id: string,
    name: string,
    text: string,
    color: string,
    appendCR = false,
): QuickButtonCommand {
    return { id, name, text, color, appendCR, action: 'fill' }
}

function common (
    id: string,
    name: string,
    text: string,
    color: string,
    description = '',
): CommonCommand {
    return { id, name, text, color, description }
}

export function createDefaultCategories (): QuickCategory[] {
    return [
        {
            id: 'category-serial',
            name: '串口专用',
            color: '#22c55e',
            quickButtons: [
                quick('serial-help', '帮助', 'help', '#2563eb'),
                quick('serial-version', '查询版本', 'version', '#0ea5e9', true),
                quick('serial-reboot', '重启设备', 'reboot', '#dc2626'),
            ],
            commonCommands: [
                common('serial-at', 'AT 检查', 'AT', '#22c55e'),
                common('serial-clear', '清屏', 'clear', '#8b5cf6'),
            ],
            scratchpad: '',
            tempSnippets: [],
        },
        {
            id: 'category-adb',
            name: 'ADB',
            color: '#38bdf8',
            quickButtons: [
                quick('adb-devices', '设备列表', 'adb devices', '#38bdf8', true),
                quick('adb-shell', '进入 Shell', 'adb shell', '#22c55e', true),
                quick('adb-reboot', '重启设备', 'adb reboot', '#dc2626'),
            ],
            commonCommands: [
                common('adb-logcat', 'Logcat', 'adb logcat', '#f59e0b'),
                common('adb-packages', '包列表', 'adb shell pm list packages', '#8b5cf6'),
            ],
            scratchpad: '',
            tempSnippets: [],
        },
    ]
}

export function createDefaultConfig (): CommandSidebarPluginConfig {
    const categories = createDefaultCategories()
    return {
        version: 2,
        enabled: true,
        sidebarOpen: true,
        sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
        activeCategoryId: categories[0].id,
        categories,
    }
}

function normalizeQuickButton (item: Partial<QuickButtonCommand>, index: number): QuickButtonCommand {
    return {
        id: item.id || createId(`quick-${index}`),
        name: item.name || '未命名按钮',
        text: item.text || '',
        color: item.color || '#22c55e',
        action: item.action === 'copy' ? 'copy' : 'fill',
        appendCR: !!item.appendCR,
    }
}

function normalizeCommonCommand (item: Partial<CommonCommand>, index: number): CommonCommand {
    return {
        id: item.id || createId(`common-${index}`),
        name: item.name || '未命名命令',
        text: item.text || '',
        color: item.color || '#0ea5e9',
        description: item.description || '',
    }
}

function normalizeTempSnippet (item: Partial<TempSnippet>, index: number): TempSnippet {
    const timestamp = now()
    return {
        id: item.id || createId(`temp-${index}`),
        name: item.name || '临时片段',
        text: item.text || '',
        color: item.color || '#f59e0b',
        pinned: !!item.pinned,
        createdAt: item.createdAt || timestamp,
        updatedAt: item.updatedAt || timestamp,
    }
}

function normalizeCategory (item: Partial<QuickCategory>, index: number): QuickCategory {
    return {
        id: item.id || createId(`category-${index}`),
        name: item.name || '未命名分类',
        color: item.color || '#22c55e',
        quickButtons: (item.quickButtons || []).map(normalizeQuickButton),
        commonCommands: (item.commonCommands || []).map(normalizeCommonCommand),
        scratchpad: item.scratchpad
            || (item.tempSnippets || []).map(snippet => snippet.text || '').filter(Boolean).join('\n\n'),
        tempSnippets: (item.tempSnippets || []).map(normalizeTempSnippet),
    }
}

export function normalizeConfig (raw: any): CommandSidebarPluginConfig {
    // Tabby omits values that match provider defaults from config.yaml. This
    // means a valid v2 config may not contain `version`, so the persisted
    // structure itself must take precedence over any leftover legacy fields.
    if (Array.isArray(raw?.categories)) {
        const categories = raw.categories.map(normalizeCategory)
        if (!categories.length) {
            categories.push(...createDefaultCategories())
        }
        return {
            version: 2,
            enabled: raw.enabled !== false,
            sidebarOpen: raw.sidebarOpen !== false,
            sidebarWidth: Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Number(raw.sidebarWidth) || DEFAULT_SIDEBAR_WIDTH)),
            activeCategoryId: categories.some(category => category.id === raw.activeCategoryId)
                ? raw.activeCategoryId
                : categories[0].id,
            categories,
        }
    }

    const hasLegacyCollections = Array.isArray(raw?.quickButtons) || Array.isArray(raw?.snippets)
    if (hasLegacyCollections) {
        const legacy = raw as LegacyCommandSidebarPluginConfig
        const categories = createDefaultCategories()
        categories[0] = {
            ...categories[0],
            quickButtons: legacy.quickButtons
                ? legacy.quickButtons.map(normalizeQuickButton)
                : categories[0].quickButtons,
            commonCommands: legacy.snippets
                ? legacy.snippets.map(normalizeCommonCommand)
                : categories[0].commonCommands,
            scratchpad: '',
        }
        return {
            ...createDefaultConfig(),
            enabled: legacy.enabled !== false,
            sidebarOpen: legacy.sidebarOpen !== false,
            categories,
            activeCategoryId: categories[0].id,
        }
    }

    return createDefaultConfig()
}
