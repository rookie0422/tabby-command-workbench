import { Injectable } from '@angular/core'
import { BaseTerminalTabComponent, TerminalDecorator } from 'tabby-terminal'
import { CommandWorkbenchService } from './quickButtons.service'

@Injectable()
export class CommandWorkbenchTerminalDecorator extends TerminalDecorator {
    constructor (
        private commandWorkbench: CommandWorkbenchService,
    ) {
        super()
    }

    attach (tab: BaseTerminalTabComponent<any>): void {
        this.commandWorkbench.registerTab(tab)
    }

    detach (tab: BaseTerminalTabComponent<any>): void {
        this.commandWorkbench.unregisterTab(tab)
        super.detach(tab)
    }
}
