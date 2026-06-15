import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { CommandWorkbenchSettingsTabComponent } from './settingsTab.component'
import { CONFIG_KEY } from './config'

@Injectable()
export class CommandWorkbenchSettingsTabProvider extends SettingsTabProvider {
    id = CONFIG_KEY
    icon = 'sidebar'
    title = 'Command Workbench'

    getComponentType (): any {
        return CommandWorkbenchSettingsTabComponent
    }
}
