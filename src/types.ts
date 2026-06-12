export type QuickCommandAction = 'fill' | 'copy'

export interface ShelfItem {
    id: string
    name: string
    text: string
    color: string
}

export interface QuickButtonCommand extends ShelfItem {
    action: QuickCommandAction
    appendCR: boolean
}

export interface CommonCommand extends ShelfItem {
    description: string
}

export interface TempSnippet extends ShelfItem {
    pinned: boolean
    createdAt: number
    updatedAt: number
}

export interface QuickCategory {
    id: string
    name: string
    color: string
    quickButtons: QuickButtonCommand[]
    commonCommands: CommonCommand[]
    scratchpad: string
    tempSnippets: TempSnippet[]
}

export interface CommandSidebarPluginConfig {
    version: 2
    enabled: boolean
    sidebarOpen: boolean
    sidebarWidth: number
    activeCategoryId: string
    categories: QuickCategory[]
}

export interface LegacyCommandSidebarPluginConfig {
    enabled?: boolean
    sidebarOpen?: boolean
    quickButtons?: Array<Partial<QuickButtonCommand>>
    snippets?: Array<Partial<ShelfItem>>
}
