import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { QuickButtonsSettingsTabComponent } from './settingsTab.component'

@Injectable()
export class QuickButtonsSettingsTabProvider extends SettingsTabProvider {
    id = 'serialCommandSidebar'
    icon = 'sidebar'
    title = 'Serial Command Sidebar'

    getComponentType (): any {
        return QuickButtonsSettingsTabComponent
    }
}
