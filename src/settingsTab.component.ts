import { Component } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { CommandSidebarPluginConfig } from './types'
import { CONFIG_KEY } from './config'
import { normalizeConfig } from './model'

@Component({
    selector: 'command-workbench-settings',
    template: `
        <div class="command-workbench-settings">
            <label class="setting-line">
                <input type="checkbox" [(ngModel)]="model.enabled" (change)="save()">
                启用右侧常驻命令栏
            </label>

            <label class="setting-line">
                <input type="checkbox" [(ngModel)]="model.sidebarOpen" (change)="save()">
                启动时默认展开侧栏
            </label>

            <p class="hint">
                左键用于切换和执行；右键分类、按钮或命令可新增、编辑、复制和删除。拖动侧栏左边缘可调整宽度。
            </p>
        </div>
    `,
    styles: [`
        .command-workbench-settings {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 680px;
        }

        .setting-line {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .hint {
            margin: 0;
            color: var(--theme-text-muted-color, #64748b);
            font-size: 13px;
        }
    `],
})
export class CommandWorkbenchSettingsTabComponent {
    model: CommandSidebarPluginConfig

    constructor (
        private config: ConfigService,
    ) {
        this.model = this.getModel()
    }

    save (): void {
        const store = this.config.store as any
        if (!store[CONFIG_KEY]) {
            store[CONFIG_KEY] = {}
        }
        const normalized = normalizeConfig(store[CONFIG_KEY])
        normalized.enabled = this.model.enabled
        normalized.sidebarOpen = this.model.sidebarOpen
        this.model = normalized

        const target = store[CONFIG_KEY]
        target.version = normalized.version
        target.enabled = normalized.enabled
        target.sidebarOpen = normalized.sidebarOpen
        target.sidebarWidth = normalized.sidebarWidth
        target.activeCategoryId = normalized.activeCategoryId
        target.categories = normalized.categories.map(({ tempSnippets: _, ...category }) => category)
        this.config.save()
    }

    private getModel (): CommandSidebarPluginConfig {
        const store = this.config.store as any
        return normalizeConfig(store[CONFIG_KEY])
    }
}
