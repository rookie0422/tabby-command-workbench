import { ConfigProvider } from 'tabby-core'
import { createDefaultConfig } from './model'

export class QuickButtonsConfigProvider extends ConfigProvider {
    defaults = {
        serialCommandSidebar: createDefaultConfig(),
    }
}
