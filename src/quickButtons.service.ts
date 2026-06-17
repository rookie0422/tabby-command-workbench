import { Injectable } from '@angular/core'
import { AppService, ConfigService, PlatformService, SplitTabComponent } from 'tabby-core'
import { BaseTerminalTabComponent } from 'tabby-terminal'
import * as yaml from 'js-yaml'
import { createId, normalizeConfig } from './model'
import { CONFIG_KEY, LEGACY_CONFIG_KEY, selectPersistedConfig } from './config'
import { QUICK_SHELF_STYLES } from './styles'
import {
    DEFAULT_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
    MIN_SIDEBAR_WIDTH,
    MIN_TERMINAL_WIDTH,
    RESIZE_SAVE_DELAY_MS,
    SCRATCH_SAVE_DELAY_MS,
    STATUS_VISIBLE_MS,
    LAYOUT_REFRESH_DELAY_MS,
} from './constants'
import {
    CommandSidebarPluginConfig,
    CommonCommand,
    QuickButtonCommand,
    QuickCategory,
    ShelfItem,
} from './types'

type ItemKind = 'quick' | 'common'
type EditableItem = QuickButtonCommand | CommonCommand

interface EditingState {
    categoryId: string
    id: string
    kind: ItemKind
}

@Injectable({ providedIn: 'root' })
export class CommandWorkbenchService {
    private terminals: BaseTerminalTabComponent<any>[] = []
    private sidebar: HTMLElement | null = null
    private toggle: HTMLButtonElement | null = null
    private style: HTMLStyleElement | null = null
    private editing: EditingState | null = null
    private categoryEditing = false
    private statusTimer: any = null
    private configMigrated = false
    private contextMenu: HTMLElement | null = null
    private contextMenuCloseListener: ((e: Event) => void) | null = null
    private contextMenuTimer: any = null
    private editorModal: HTMLElement | null = null
    private model: CommandSidebarPluginConfig | null = null
    private scratchSaveTimer: any = null
    private resizeSaveTimer: any = null
    private layoutRefreshFrame: number | null = null
    private readonly flushScratchSave = (): void => {
        if (this.scratchSaveTimer === null) {
            return
        }
        clearTimeout(this.scratchSaveTimer)
        this.scratchSaveTimer = null
        this.writeModelToConfig(this.getModel())
        void this.config.save()
    }

    constructor (
        private config: ConfigService,
        private app: AppService,
        private platform: PlatformService,
    ) {
        this.config.ready$.subscribe(() => {
            this.migrateConfig()
            this.ensureUi()
        })
        this.config.changed$.subscribe(() => {
            const focused = document.activeElement
            if (
                focused
                && (
                    this.sidebar?.contains(focused)
                    || this.editorModal?.contains(focused)
                )
            ) {
                return
            }
            this.render()
        })
        this.app.activeTabChange$.subscribe(() => this.renderTarget())
        window.addEventListener('beforeunload', this.flushScratchSave)
        window.addEventListener('blur', this.flushScratchSave)
    }

    registerTab (tab: BaseTerminalTabComponent<any>): void {
        if (!this.terminals.includes(tab)) {
            this.terminals.push(tab)
        }
        this.migrateConfig()
        this.ensureUi()
    }

    unregisterTab (tab: BaseTerminalTabComponent<any>): void {
        this.terminals = this.terminals.filter(candidate => candidate !== tab)
        this.renderTarget()
    }

    private migrateConfig (): void {
        if (this.configMigrated || !this.config.store) {
            return
        }
        let source: any = (this.config.store as any)[CONFIG_KEY]
        let hasLegacyConfig = false
        try {
            const raw = yaml.load(this.config.readRaw()) as any
            source = selectPersistedConfig(raw, source)
            hasLegacyConfig = raw?.[LEGACY_CONFIG_KEY] !== undefined
        } catch {
            // Continue with the proxied config if raw YAML parsing fails.
        }
        const normalized = normalizeConfig(source)
        this.configMigrated = true
        this.model = normalized
        this.writeModelToConfig(normalized)
        void this.persistMigration(hasLegacyConfig)
    }

    private async persistMigration (hasLegacyConfig: boolean): Promise<void> {
        // Save the new key first. Removing the only persisted copy in the same
        // write can lose data if another Tabby config save races startup.
        await this.config.save()
        if (hasLegacyConfig) {
            this.removeConfigValue(this.config.store, LEGACY_CONFIG_KEY)
            await this.config.save()
        }
    }

    private ensureUi (): void {
        this.ensureStyle()
        if (!this.sidebar) {
            this.sidebar = document.createElement('aside')
            this.sidebar.className = 'quick-shelf'
            document.body.appendChild(this.sidebar)
        }
        if (!this.toggle) {
            this.toggle = document.createElement('button')
            this.toggle.type = 'button'
            this.toggle.className = 'quick-shelf-toggle'
            this.toggle.innerHTML = '<span>命令工作台</span>'
            this.toggle.title = '打开命令工作台'
            this.toggle.addEventListener('click', () => this.updateModel(model => {
                model.sidebarOpen = true
            }))
            document.body.appendChild(this.toggle)
        }
        this.render()
    }

    private render (): void {
        if (!this.sidebar || !this.toggle || !this.config.store) {
            return
        }
        this.closeContextMenu()
        this.closeEditorModal()

        const model = this.getModel()
        this.sidebar.style.setProperty('--shelf-width', `${model.sidebarWidth}px`)
        this.sidebar.style.display = model.enabled && model.sidebarOpen ? 'flex' : 'none'
        this.toggle.style.display = model.enabled && !model.sidebarOpen ? 'flex' : 'none'
        this.applyDockState(model)
        this.sidebar.innerHTML = ''

        if (!model.enabled || !model.sidebarOpen) {
            return
        }

        const category = this.getActiveCategory(model)
        this.sidebar.append(
            this.createResizeHandle(),
            this.createHeader(),
            this.createCategoryBar(model),
        )

        const body = document.createElement('div')
        body.className = 'quick-shelf__body'
        body.append(
            this.createQuickSection(category),
            this.createCommonSection(category),
            this.createTempSection(category),
        )
        this.sidebar.appendChild(body)
        this.renderEditorModal(model)
    }

    private createHeader (): HTMLElement {
        const header = document.createElement('header')
        header.className = 'quick-shelf__header'

        const heading = document.createElement('div')
        heading.className = 'quick-shelf__heading'
        heading.innerHTML = '<strong>Command Workbench</strong><span class="quick-shelf__target"></span>'

        const close = this.iconButton('×', '收起侧栏', () => {
            this.updateModel(model => {
                model.sidebarOpen = false
            })
            queueMicrotask(() => this.focusTerminal())
        })

        header.append(heading, close)
        queueMicrotask(() => this.renderTarget())
        return header
    }

    private createResizeHandle (): HTMLElement {
        const handle = document.createElement('div')
        handle.className = 'quick-shelf__resize-handle'
        handle.title = '拖动调整命令工作台宽度'
        handle.addEventListener('pointerdown', event => {
            if (event.button !== 0) {
                return
            }
            event.preventDefault()
            event.stopPropagation()
            const startX = event.clientX
            const model = this.getModel()
            const startWidth = model.sidebarWidth
            const maxWidth = this.getMaxDockWidth()
            handle.setPointerCapture(event.pointerId)
            document.body.classList.add('command-workbench-resizing')

            const onMove = (moveEvent: PointerEvent): void => {
                const width = this.clampWidth(startWidth + startX - moveEvent.clientX, maxWidth)
                model.sidebarWidth = width
                this.writeModelToConfig(model)
                this.applyDockWidth(width)
                this.scheduleLayoutRefresh()
                clearTimeout(this.resizeSaveTimer)
                this.resizeSaveTimer = setTimeout(() => {
                    this.resizeSaveTimer = null
                    void this.config.save()
                }, RESIZE_SAVE_DELAY_MS)
            }
            const pointerId = event.pointerId
            let cleaned = false
            const cleanup = (): void => {
                if (cleaned) {
                    return
                }
                cleaned = true
                if (handle.hasPointerCapture(pointerId)) {
                    handle.releasePointerCapture(pointerId)
                }
                document.body.classList.remove('command-workbench-resizing')
                window.removeEventListener('pointermove', onMove, true)
                window.removeEventListener('pointerup', onUp, true)
                window.removeEventListener('pointercancel', cleanup, true)
                window.removeEventListener('blur', cleanup, true)
                handle.removeEventListener('lostpointercapture', cleanup)
                this.flushResizeSave()
            }
            const onUp = (): void => {
                cleanup()
            }

            window.addEventListener('pointermove', onMove, true)
            window.addEventListener('pointerup', onUp, true)
            window.addEventListener('pointercancel', cleanup, true)
            window.addEventListener('blur', cleanup, true)
            handle.addEventListener('lostpointercapture', cleanup)
        })
        return handle
    }

    private renderTarget (): void {
        const element = this.sidebar?.querySelector<HTMLElement>('.quick-shelf__target')
        if (!element) {
            return
        }
        const terminal = this.findActiveTerminal()
        element.textContent = terminal ? `目标：${terminal.title || '当前终端'}` : '未找到活动终端'
        element.classList.toggle('is-error', !terminal)
    }

    private createCategoryBar (model: CommandSidebarPluginConfig): HTMLElement {
        const wrapper = document.createElement('div')
        wrapper.className = 'quick-shelf__category-wrap'
        wrapper.title = '左键切换分类，右键管理分类'
        wrapper.addEventListener('contextmenu', event => {
            if (event.target === wrapper || event.target === tabs) {
                this.openContextMenu(event, [
                    { label: '新建分类', action: () => this.addCategory() },
                ])
            }
        })

        const tabs = document.createElement('div')
        tabs.className = 'quick-shelf__categories'
        for (const category of model.categories) {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = `quick-shelf__category ${category.id === model.activeCategoryId ? 'is-active' : ''}`
            button.style.setProperty('--category-color', category.color)
            button.textContent = category.name
            button.addEventListener('click', event => {
                event.preventDefault()
                event.stopPropagation()
                this.editing = null
                this.categoryEditing = false
                this.updateModel(next => {
                    next.activeCategoryId = category.id
                })
            })
            button.addEventListener('contextmenu', event => {
                this.openContextMenu(event, [
                    {
                        label: '编辑分类',
                        action: () => {
                            this.updateModel(next => {
                                next.activeCategoryId = category.id
                            })
                            this.categoryEditing = true
                            this.render()
                        },
                    },
                    { label: '新建分类', action: () => this.addCategory() },
                    {
                        label: '删除分类',
                        danger: true,
                        action: () => this.removeCategory(category.id),
                    },
                ])
            })
            tabs.appendChild(button)
        }

        const menu = this.iconButton('⋯', '分类管理', () => {
            const rect = menu.getBoundingClientRect()
            this.openContextMenuAt(rect.right, rect.bottom + 4, [
                {
                    label: '编辑当前分类',
                    action: () => {
                        this.categoryEditing = true
                        this.render()
                    },
                },
                { label: '新建分类', action: () => this.addCategory() },
                {
                    label: '删除当前分类',
                    danger: true,
                    action: () => this.removeCategory(model.activeCategoryId),
                },
            ])
        })
        menu.classList.add('quick-shelf__category-menu')

        wrapper.append(tabs, menu)
        return wrapper
    }

    private createCategoryEditor (category: QuickCategory): HTMLElement {
        const editor = document.createElement('div')
        editor.className = 'quick-shelf__category-editor'
        const name = this.input('分类名称', category.name)
        const color = this.input('分类颜色', category.color, 'color')
        const actions = this.actions(
            this.button('保存分类', () => {
                this.updateCategory(category.id, target => {
                    target.name = name.input.value.trim() || '未命名分类'
                    target.color = color.input.value
                })
                this.categoryEditing = false
                this.render()
            }, 'primary'),
            this.button('删除分类', () => this.removeCategory(category.id), 'danger'),
            this.button('取消', () => {
                this.categoryEditing = false
                this.render()
            }),
        )
        editor.append(name.wrapper, color.wrapper, actions)
        return editor
    }

    private createQuickSection (category: QuickCategory): HTMLElement {
        const content = document.createElement('div')
        content.className = 'quick-shelf__quick-grid'

        for (const command of category.quickButtons) {
            const card = document.createElement('article')
            card.className = 'quick-shelf__quick-card'
            card.style.setProperty('--item-color', command.color)
            card.title = '左键执行，右键管理'
            card.addEventListener('contextmenu', event => this.openItemContextMenu(event, category.id, command, 'quick'))

            const execute = document.createElement('button')
            execute.type = 'button'
            execute.className = 'quick-shelf__quick-execute'
            execute.textContent = command.name
            execute.title = command.text
            execute.addEventListener('click', () => this.executeQuick(command))
            card.append(execute)
            content.appendChild(card)
        }

        const section = this.section(
            '快捷命令按钮',
            `${category.quickButtons.length}`,
            null,
            content,
            event => this.openContextMenu(event, [
                { label: '新增快捷按钮', action: () => this.addItem(category.id, 'quick') },
            ]),
        )
        section.classList.add('is-quick')
        return section
    }

    private createCommonSection (category: QuickCategory): HTMLElement {
        const content = document.createElement('div')
        content.className = 'quick-shelf__list'

        for (const command of category.commonCommands) {
            const card = document.createElement('article')
            card.className = 'quick-shelf__item-card'
            card.style.setProperty('--item-color', command.color)
            card.classList.add('is-command')
            card.title = `${command.text}${command.description ? `\n${command.description}` : ''}\n左键复制，右键管理`
            card.tabIndex = 0
            card.setAttribute('role', 'button')
            const text = document.createElement('pre')
            text.textContent = command.text
            card.appendChild(text)
            if (command.description) {
                const desc = document.createElement('small')
                desc.className = 'quick-shelf__description'
                desc.textContent = command.description
                card.appendChild(desc)
            }
            card.addEventListener('click', () => this.copyText(command.text))
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    this.copyText(command.text)
                }
            })
            card.addEventListener('contextmenu', event => this.openItemContextMenu(event, category.id, command, 'common'))
            content.appendChild(card)
        }

        const section = this.section(
            '常用命令',
            `${category.commonCommands.length}`,
            null,
            content,
            event => this.openContextMenu(event, [
                { label: '新增常用命令', action: () => this.addItem(category.id, 'common') },
            ]),
        )
        section.classList.add('is-common')
        return section
    }

    private createTempSection (category: QuickCategory): HTMLElement {
        const content = document.createElement('div')
        content.className = 'quick-shelf__scratchpad'
        const textarea = document.createElement('textarea')
        textarea.value = category.scratchpad
        textarea.placeholder = '把多条命令或临时文本粘贴到这里。可自由编辑，并手动选择任意部分复制。'
        textarea.spellcheck = false
        this.protectTextShortcuts(textarea)
        textarea.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                this.focusTerminal()
            }
        })
        textarea.addEventListener('input', () => {
            category.scratchpad = textarea.value
            this.writeModelToConfig(this.getModel())
            clearTimeout(this.scratchSaveTimer)
            this.scratchSaveTimer = setTimeout(() => {
                this.scratchSaveTimer = null
                void this.config.save()
            }, SCRATCH_SAVE_DELAY_MS)
        })
        textarea.addEventListener('blur', this.flushScratchSave)
        content.appendChild(textarea)

        const section = this.section(
            '临时复制区',
            '草稿',
            null,
            content,
        )
        section.classList.add('is-scratch')
        return section
    }

    private section (
        titleText: string,
        count: string,
        headerAction: HTMLElement | null,
        content: HTMLElement,
        onContextMenu?: (event: MouseEvent) => void,
    ): HTMLElement {
        const section = document.createElement('section')
        section.className = 'quick-shelf__section'
        if (onContextMenu) {
            section.title = '右键打开管理菜单'
        }
        const header = document.createElement('div')
        header.className = 'quick-shelf__section-header'
        const title = document.createElement('div')
        title.className = 'quick-shelf__section-title'
        title.innerHTML = onContextMenu
            ? '<strong></strong><span></span><small>右键管理</small>'
            : '<strong></strong><span></span>'
        title.querySelector('strong')!.textContent = titleText
        title.querySelector('span')!.textContent = count
        header.appendChild(title)
        if (headerAction) {
            header.appendChild(headerAction)
        }
        if (onContextMenu) {
            section.addEventListener('contextmenu', event => {
                if (
                    event.target === section
                    || event.target === content
                    || event.target === header
                    || event.target === title
                ) {
                    onContextMenu(event)
                }
            })
        }
        section.append(header, content)
        return section
    }

    private openItemContextMenu (
        event: MouseEvent,
        categoryId: string,
        item: EditableItem,
        kind: ItemKind,
    ): void {
        this.openContextMenu(event, [
            { label: '编辑', action: () => this.startEdit(categoryId, item.id, kind) },
            { label: '复制内容', action: () => this.copyText(item.text) },
            ...(kind === 'common'
                ? [
                    { label: '填充到当前终端', action: () => this.fillTerminal(item.text) },
                    { label: '发送并回车', action: () => this.fillTerminal(item.text, true) },
                ]
                : []),
            {
                label: '删除',
                danger: true,
                action: () => this.removeItem(categoryId, item.id, kind),
            },
        ])
    }

    private openContextMenu (
        event: MouseEvent,
        items: Array<{ label: string, action: () => void, danger?: boolean }>,
    ): void {
        event.preventDefault()
        event.stopPropagation()
        this.openContextMenuAt(event.clientX, event.clientY, items)
    }

    private openContextMenuAt (
        x: number,
        y: number,
        items: Array<{ label: string, action: () => void, danger?: boolean }>,
    ): void {
        this.closeContextMenu()
        const menu = document.createElement('div')
        menu.className = 'quick-shelf__context-menu'
        menu.setAttribute('role', 'menu')
        for (const item of items) {
            const button = document.createElement('button')
            button.type = 'button'
            button.setAttribute('role', 'menuitem')
            button.textContent = item.label
            button.className = item.danger ? 'is-danger' : ''
            button.addEventListener('click', event => {
                event.preventDefault()
                event.stopPropagation()
                this.closeContextMenu()
                item.action()
            })
            menu.appendChild(button)
        }
        document.body.appendChild(menu)
        this.contextMenu = menu

        const rect = menu.getBoundingClientRect()
        menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))}px`
        menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))}px`

        const close = (event: Event): void => {
            if (!menu.contains(event.target as Node)) {
                this.closeContextMenu()
            }
        }
        this.contextMenuCloseListener = close
        this.contextMenuTimer = setTimeout(() => {
            this.contextMenuTimer = null
            document.addEventListener('pointerdown', close, { capture: true })
        })
        menu.querySelector<HTMLButtonElement>('button')?.focus()
    }

    private closeContextMenu (): void {
        if (this.contextMenuTimer !== null) {
            clearTimeout(this.contextMenuTimer)
            this.contextMenuTimer = null
        }
        if (this.contextMenuCloseListener) {
            document.removeEventListener('pointerdown', this.contextMenuCloseListener, { capture: true })
            this.contextMenuCloseListener = null
        }
        this.contextMenu?.remove()
        this.contextMenu = null
    }

    private renderEditorModal (model: CommandSidebarPluginConfig): void {
        let title = ''
        let editor: HTMLElement | null = null

        if (this.categoryEditing) {
            title = '编辑分类'
            editor = this.createCategoryEditor(this.getActiveCategory(model))
        } else if (this.editing) {
            const category = model.categories.find(item => item.id === this.editing!.categoryId)
            const item = this.editing.kind === 'quick'
                ? category?.quickButtons.find(command => command.id === this.editing!.id)
                : category?.commonCommands.find(command => command.id === this.editing!.id)
            if (category && item) {
                title = this.editing.kind === 'quick' ? '编辑快捷按钮' : '编辑常用命令'
                editor = this.createItemEditor(category.id, item, this.editing.kind)
            }
        }

        if (!editor) {
            return
        }

        const backdrop = document.createElement('div')
        backdrop.className = 'quick-shelf__modal-backdrop'
        const dialog = document.createElement('div')
        dialog.className = 'quick-shelf__modal'
        dialog.setAttribute('role', 'dialog')
        dialog.setAttribute('aria-modal', 'true')

        const header = document.createElement('header')
        header.className = 'quick-shelf__modal-header'
        const heading = document.createElement('strong')
        heading.textContent = title
        const close = this.iconButton('×', '关闭编辑弹窗', () => this.cancelEditing())
        header.append(heading, close)

        const body = document.createElement('div')
        body.className = 'quick-shelf__modal-body'
        body.appendChild(editor)
        dialog.append(header, body)
        backdrop.appendChild(dialog)
        backdrop.addEventListener('pointerdown', event => {
            if (event.target === backdrop) {
                this.cancelEditing()
            }
        })
        document.body.appendChild(backdrop)
        this.editorModal = backdrop
        queueMicrotask(() => dialog.querySelector<HTMLInputElement>('input:not([type="color"])')?.focus())
    }

    private cancelEditing (): void {
        this.editing = null
        this.categoryEditing = false
        this.render()
    }

    private closeEditorModal (): void {
        this.editorModal?.remove()
        this.editorModal = null
    }

    private createItemEditor (categoryId: string, item: EditableItem, kind: ItemKind): HTMLElement {
        const card = document.createElement('article')
        card.className = 'quick-shelf__item-card is-editing'
        card.style.setProperty('--item-color', item.color)

        const name = this.input('名称', item.name)
        const color = this.input('颜色', item.color, 'color')
        const text = this.textarea('内容', item.text)
        card.append(name.wrapper, color.wrapper, text.wrapper)

        let description: ReturnType<CommandWorkbenchService['input']> | null = null
        let action: ReturnType<CommandWorkbenchService['select']> | null = null
        let appendCR: HTMLInputElement | null = null

        if (kind === 'common') {
            description = this.input('说明（可选）', (item as CommonCommand).description)
            card.appendChild(description.wrapper)
        }
        if (kind === 'quick') {
            action = this.select('点击行为', [
                { value: 'fill', label: '填充到当前终端' },
                { value: 'copy', label: '复制到剪贴板' },
            ], (item as QuickButtonCommand).action)
            card.appendChild(action.wrapper)

            const checkbox = document.createElement('label')
            checkbox.className = 'quick-shelf__checkbox'
            appendCR = document.createElement('input')
            appendCR.type = 'checkbox'
            appendCR.checked = (item as QuickButtonCommand).appendCR
            checkbox.append(appendCR, document.createTextNode(' 填充后自动回车'))
            card.appendChild(checkbox)
        }

        card.appendChild(this.actions(
            this.button('保存', () => {
                this.updateItem(categoryId, item.id, kind, target => {
                    target.name = name.input.value.trim() || '未命名'
                    target.color = color.input.value
                    target.text = text.input.value
                    if (kind === 'common') {
                        ;(target as CommonCommand).description = description?.input.value || ''
                    }
                    if (kind === 'quick') {
                        ;(target as QuickButtonCommand).action = action?.input.value === 'copy' ? 'copy' : 'fill'
                        ;(target as QuickButtonCommand).appendCR = !!appendCR?.checked
                    }
                })
                this.editing = null
                this.render()
            }, 'primary'),
            this.button('取消', () => {
                this.editing = null
                this.render()
            }),
        ))
        return card
    }

    private input (
        labelText: string,
        value: string,
        type = 'text',
    ): { wrapper: HTMLLabelElement, input: HTMLInputElement } {
        const wrapper = document.createElement('label')
        wrapper.className = 'quick-shelf__field'
        wrapper.appendChild(document.createTextNode(labelText))
        const input = document.createElement('input')
        input.type = type
        input.value = value || ''
        this.protectTextShortcuts(input)
        wrapper.appendChild(input)
        return { wrapper, input }
    }

    private textarea (
        labelText: string,
        value: string,
    ): { wrapper: HTMLLabelElement, input: HTMLTextAreaElement } {
        const wrapper = document.createElement('label')
        wrapper.className = 'quick-shelf__field'
        wrapper.appendChild(document.createTextNode(labelText))
        const input = document.createElement('textarea')
        input.value = value || ''
        this.protectTextShortcuts(input)
        wrapper.appendChild(input)
        return { wrapper, input }
    }

    private select (
        labelText: string,
        options: Array<{ value: string, label: string }>,
        value: string,
    ): { wrapper: HTMLLabelElement, input: HTMLSelectElement } {
        const wrapper = document.createElement('label')
        wrapper.className = 'quick-shelf__field'
        wrapper.appendChild(document.createTextNode(labelText))
        const input = document.createElement('select')
        for (const option of options) {
            const element = document.createElement('option')
            element.value = option.value
            element.textContent = option.label
            input.appendChild(element)
        }
        input.value = value
        this.protectTextShortcuts(input)
        wrapper.appendChild(input)
        return { wrapper, input }
    }

    private protectTextShortcuts (
        element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    ): void {
        const stopTerminalShortcut = (event: KeyboardEvent): void => {
            const key = event.key.toLowerCase()
            const isEditingShortcut = (event.ctrlKey || event.metaKey)
                && ['a', 'c', 'v', 'x', 'y', 'z', 'insert'].includes(key)
            const isShiftInsert = event.shiftKey && key === 'insert'
            if (isEditingShortcut || isShiftInsert) {
                event.stopPropagation()
                event.stopImmediatePropagation()
            }
        }
        element.addEventListener('keydown', stopTerminalShortcut, true)
        element.addEventListener('keydown', stopTerminalShortcut)
        element.addEventListener('keyup', stopTerminalShortcut, true)
        element.addEventListener('keyup', stopTerminalShortcut)
    }

    private applyDockState (model: CommandSidebarPluginConfig): void {
        const shouldDock = model.enabled && model.sidebarOpen
        document.body.classList.toggle('command-workbench-docked', shouldDock)
        if (shouldDock) {
            this.applyDockWidth(model.sidebarWidth)
        } else {
            document.body.style.removeProperty('--command-workbench-width')
        }
        this.scheduleLayoutRefresh()
    }

    private applyDockWidth (width: number): void {
        const clamped = this.clampWidth(width, this.getMaxDockWidth())
        this.sidebar?.style.setProperty('--shelf-width', `${clamped}px`)
        document.body.style.setProperty('--command-workbench-width', `${clamped}px`)
    }

    private getMaxDockWidth (): number {
        return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - MIN_TERMINAL_WIDTH))
    }

    private clampWidth (width: number, maxWidth: number): number {
        return Math.round(Math.min(maxWidth, Math.max(MIN_SIDEBAR_WIDTH, width)))
    }

    private flushResizeSave (): void {
        if (this.resizeSaveTimer !== null) {
            clearTimeout(this.resizeSaveTimer)
            this.resizeSaveTimer = null
        }
        void this.config.save()
    }

    private scheduleLayoutRefresh (): void {
        if (this.layoutRefreshFrame !== null) {
            cancelAnimationFrame(this.layoutRefreshFrame)
        }
        const refresh = (): void => {
            this.layoutRefreshFrame = null
            const active = this.app.activeTab as any
            if (typeof active?.layout === 'function') {
                active.layout()
            }
            window.dispatchEvent(new Event('resize'))
        }
        this.layoutRefreshFrame = requestAnimationFrame(() => {
            refresh()
            setTimeout(refresh, LAYOUT_REFRESH_DELAY_MS)
        })
    }

    private actions (...children: HTMLElement[]): HTMLElement {
        const row = document.createElement('div')
        row.className = 'quick-shelf__actions'
        row.append(...children)
        return row
    }

    private button (
        label: string,
        onClick: () => void,
        kind: 'secondary' | 'primary' | 'danger' = 'secondary',
    ): HTMLButtonElement {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `quick-shelf__button is-${kind}`
        button.textContent = label
        button.addEventListener('click', event => {
            event.preventDefault()
            event.stopPropagation()
            onClick()
        })
        return button
    }

    private iconButton (label: string, title: string, onClick: () => void): HTMLButtonElement {
        const button = this.button(label, onClick)
        button.classList.add('quick-shelf__icon-button')
        button.title = title
        return button
    }

    private executeQuick (command: QuickButtonCommand): void {
        if (command.action === 'copy') {
            this.copyText(command.text)
        } else {
            this.fillTerminal(command.text, command.appendCR)
        }
    }

    private fillTerminal (text: string, appendCR = false): void {
        if (!text) {
            this.showStatus('命令内容为空', true)
            return
        }
        const terminal = this.findActiveTerminal()
        if (!terminal) {
            this.showStatus('没有可用的活动终端', true)
            return
        }
        terminal.sendInput(text + (appendCR ? '\r' : ''))
        terminal.frontend?.focus()
        this.showStatus(appendCR ? '已发送并回车' : '已填充到当前终端')
    }

    private copyText (text: string): void {
        if (!text) {
            this.showStatus('复制内容为空', true)
            return
        }
        this.platform.setClipboard({ text })
        this.showStatus('已复制到剪贴板')
    }

    private findActiveTerminal (): BaseTerminalTabComponent<any> | null {
        const active = this.app.activeTab
        if (active instanceof BaseTerminalTabComponent) {
            return active
        }
        if (active instanceof SplitTabComponent) {
            const focused = active.getFocusedTab()
            if (focused instanceof BaseTerminalTabComponent) {
                return focused
            }
            const firstTerminal = active.getAllTabs().find(tab => tab instanceof BaseTerminalTabComponent)
            if (firstTerminal instanceof BaseTerminalTabComponent) {
                return firstTerminal
            }
        }
        return this.terminals.find(tab => tab.hasFocus)
            || this.terminals.find(tab => !!tab.session)
            || null
    }

    private focusTerminal (): void {
        this.findActiveTerminal()?.frontend?.focus()
    }

    private addCategory (): void {
        const id = createId('category')
        this.updateModel(model => {
            model.categories.push({
                id,
                name: '新分类',
                color: '#a855f7',
                quickButtons: [],
                commonCommands: [],
                scratchpad: '',
                tempSnippets: [],
            })
            model.activeCategoryId = id
        })
        this.categoryEditing = true
        this.editing = null
        this.render()
    }

    private removeCategory (categoryId: string): void {
        const model = this.getModel()
        if (model.categories.length === 1) {
            this.showStatus('至少保留一个分类', true)
            return
        }
        const category = model.categories.find(candidate => candidate.id === categoryId)
        if (!window.confirm(`删除分类“${category?.name || ''}”及其中全部内容？`)) {
            return
        }
        this.updateModel(next => {
            next.categories = next.categories.filter(candidate => candidate.id !== categoryId)
            next.activeCategoryId = next.categories[0].id
        })
        this.categoryEditing = false
        this.editing = null
    }

    private addItem (categoryId: string, kind: ItemKind): void {
        const id = createId(kind)
        this.updateCategory(categoryId, category => {
            if (kind === 'quick') {
                category.quickButtons.unshift({
                    id,
                    name: '新按钮',
                    text: '',
                    color: '#22c55e',
                    action: 'fill',
                    appendCR: false,
                })
            } else if (kind === 'common') {
                category.commonCommands.unshift({
                    id,
                    name: '新命令',
                    text: '',
                    color: '#0ea5e9',
                    description: '',
                })
            }
        })
        this.editing = { categoryId, id, kind }
        this.render()
    }

    private removeItem (categoryId: string, id: string, kind: ItemKind): void {
        this.updateCategory(categoryId, category => {
            if (kind === 'quick') {
                category.quickButtons = category.quickButtons.filter(item => item.id !== id)
            } else {
                category.commonCommands = category.commonCommands.filter(item => item.id !== id)
            }
        })
        if (this.editing?.id === id) {
            this.editing = null
        }
    }

    private startEdit (categoryId: string, id: string, kind: ItemKind): void {
        this.editing = { categoryId, id, kind }
        this.categoryEditing = false
        this.render()
    }

    private updateItem (
        categoryId: string,
        id: string,
        kind: ItemKind,
        mutate: (item: EditableItem) => void,
    ): void {
        this.updateCategory(categoryId, category => {
            const collection: EditableItem[] = kind === 'quick'
                ? category.quickButtons
                : category.commonCommands
            const item = collection.find(candidate => candidate.id === id)
            if (item) {
                mutate(item)
            }
        })
    }

    private updateCategory (categoryId: string, mutate: (category: QuickCategory) => void): void {
        this.updateModel(model => {
            const category = model.categories.find(candidate => candidate.id === categoryId)
            if (category) {
                mutate(category)
            }
        })
    }

    private getActiveCategory (model: CommandSidebarPluginConfig): QuickCategory {
        return model.categories.find(category => category.id === model.activeCategoryId)
            || model.categories[0]
    }

    private getModel (): CommandSidebarPluginConfig {
        if (!this.model) {
            this.model = normalizeConfig((this.config.store as any)[CONFIG_KEY])
        }
        return this.model
    }

    private updateModel (mutate: (model: CommandSidebarPluginConfig) => void): void {
        const model = this.getModel()
        mutate(model)
        this.writeModelToConfig(model)
        void this.config.save()
        this.render()
    }

    private writeModelToConfig (model: CommandSidebarPluginConfig): void {
        const target = (this.config.store as any)[CONFIG_KEY]
        target.version = model.version
        target.enabled = model.enabled
        target.sidebarOpen = model.sidebarOpen
        target.sidebarWidth = model.sidebarWidth
        target.activeCategoryId = model.activeCategoryId
        target.categories = model.categories.map(({ tempSnippets: _, ...rest }) => rest)
        this.removeConfigValue(target, 'quickButtons')
        this.removeConfigValue(target, 'snippets')
        this.removeConfigValue(target, 'activeTab')
    }

    private removeConfigValue (target: any, key: string): void {
        if (typeof target.__setValue === 'function') {
            target.__setValue(key, undefined)
        } else {
            delete target[key]
        }
    }

    private showStatus (message: string, isError = false): void {
        if (!this.sidebar) {
            return
        }
        let status = this.sidebar.querySelector<HTMLElement>('.quick-shelf__status')
        if (!status) {
            status = document.createElement('div')
            status.className = 'quick-shelf__status'
            this.sidebar.appendChild(status)
        }
        status.textContent = message
        status.classList.toggle('is-error', isError)
        status.classList.add('is-visible')
        clearTimeout(this.statusTimer)
        this.statusTimer = setTimeout(() => status?.classList.remove('is-visible'), STATUS_VISIBLE_MS)
    }

    private ensureStyle (): void {
        if (this.style) {
            return
        }
        this.style = document.createElement('style')
        this.style.textContent = QUICK_SHELF_STYLES
        document.head.appendChild(this.style)
    }
}
