import { ConfigProvider } from 'tabby-core'
import { createDefaultConfig } from './model'
import { CONFIG_KEY, LEGACY_CONFIG_KEY } from './config'

export class CommandWorkbenchConfigProvider extends ConfigProvider {
    defaults = {
        [CONFIG_KEY]: createDefaultConfig(),
        // Keep the old top-level key visible long enough to migrate it before
        // Tabby performs any unrelated config save.
        [LEGACY_CONFIG_KEY]: null,
    }
}
