import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import TabbyCoreModule, { ConfigProvider } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'
import { TerminalDecorator } from 'tabby-terminal'

import { CommandWorkbenchConfigProvider } from './configProvider'
import { CommandWorkbenchSettingsTabProvider } from './settingsTabProvider'
import { CommandWorkbenchSettingsTabComponent } from './settingsTab.component'
import { CommandWorkbenchTerminalDecorator } from './terminalDecorator'

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TabbyCoreModule,
    ],
    providers: [
        { provide: ConfigProvider, useClass: CommandWorkbenchConfigProvider, multi: true },
        { provide: SettingsTabProvider, useClass: CommandWorkbenchSettingsTabProvider, multi: true },
        { provide: TerminalDecorator, useClass: CommandWorkbenchTerminalDecorator, multi: true },
    ],
    declarations: [
        CommandWorkbenchSettingsTabComponent,
    ],
})
export default class CommandWorkbenchModule { }
