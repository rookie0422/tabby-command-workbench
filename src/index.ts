import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import TabbyCoreModule, { ConfigProvider } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'
import { TerminalDecorator } from 'tabby-terminal'

import { QuickButtonsConfigProvider } from './configProvider'
import { QuickButtonsSettingsTabProvider } from './settingsTabProvider'
import { QuickButtonsSettingsTabComponent } from './settingsTab.component'
import { QuickButtonsTerminalDecorator } from './terminalDecorator'

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TabbyCoreModule,
    ],
    providers: [
        { provide: ConfigProvider, useClass: QuickButtonsConfigProvider, multi: true },
        { provide: SettingsTabProvider, useClass: QuickButtonsSettingsTabProvider, multi: true },
        { provide: TerminalDecorator, useClass: QuickButtonsTerminalDecorator, multi: true },
    ],
    declarations: [
        QuickButtonsSettingsTabComponent,
    ],
})
export default class QuickButtonsModule { }
