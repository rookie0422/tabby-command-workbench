import { Injectable } from '@angular/core'
import { BaseTerminalTabComponent, TerminalDecorator } from 'tabby-terminal'
import { CommandSidebarService } from './quickButtons.service'

@Injectable()
export class QuickButtonsTerminalDecorator extends TerminalDecorator {
    constructor (
        private commandSidebar: CommandSidebarService,
    ) {
        super()
    }

    attach (tab: BaseTerminalTabComponent<any>): void {
        this.commandSidebar.registerTab(tab)
    }

    detach (tab: BaseTerminalTabComponent<any>): void {
        this.commandSidebar.unregisterTab(tab)
        super.detach(tab)
    }
}
