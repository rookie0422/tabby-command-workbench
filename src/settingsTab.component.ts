import { Component } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { CommandSidebarPluginConfig } from './types'

@Component({
    selector: 'serial-command-sidebar-settings',
    template: `
        <div class="serial-command-sidebar-settings">
            <label class="setting-line">
                <input type="checkbox" [(ngModel)]="model.enabled" (change)="save()">
                启用右侧常驻命令栏
            </label>

            <label class="setting-line">
                <input type="checkbox" [(ngModel)]="model.sidebarOpen" (change)="save()">
                启动时默认展开侧栏
            </label>

            <label class="setting-column">
                <span>侧栏宽度：{{ model.sidebarWidth }} px</span>
                <input
                    type="range"
                    min="320"
                    max="620"
                    step="10"
                    [(ngModel)]="model.sidebarWidth"
                    (change)="save()"
                >
            </label>

            <p class="hint">
                左键用于切换和执行；右键分类、按钮或命令可新增、编辑、复制和删除。
            </p>
        </div>
    `,
    styles: [`
        .serial-command-sidebar-settings {
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

        .setting-column {
            display: flex;
            max-width: 360px;
            flex-direction: column;
            gap: 8px;
        }

        .hint {
            margin: 0;
            color: var(--theme-text-muted-color, #64748b);
            font-size: 13px;
        }
    `],
})
export class QuickButtonsSettingsTabComponent {
    model: CommandSidebarPluginConfig

    constructor (
        private config: ConfigService,
    ) {
        this.model = this.getModel()
    }

    save (): void {
        const target = (this.config.store as any).serialCommandSidebar
        target.enabled = this.model.enabled
        target.sidebarOpen = this.model.sidebarOpen
        target.sidebarWidth = this.model.sidebarWidth
        this.config.save()
    }

    private getModel (): CommandSidebarPluginConfig {
        const store = this.config.store as any
        return store.serialCommandSidebar
    }
}
