const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const ts = require('typescript')

function loadTypeScriptModule (filename) {
    const source = fs.readFileSync(filename, 'utf8')
    const output = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
            esModuleInterop: true,
        },
        fileName: filename,
    }).outputText
    const loaded = new Module(filename, module)
    loaded.filename = filename
    loaded.paths = Module._nodeModulePaths(path.dirname(filename))
    loaded._compile(output, filename)
    return loaded.exports
}

const model = loadTypeScriptModule(path.resolve(__dirname, '../src/model.ts'))
const config = loadTypeScriptModule(path.resolve(__dirname, '../src/config.ts'))

const mixedConfig = {
    quickButtons: [
        {
            id: 'legacy-button',
            name: '旧按钮',
            text: 'legacy',
            color: '#dc2626',
            appendCR: false,
        },
    ],
    activeTab: 'snippets',
    activeCategoryId: 'custom-category',
    categories: [
        {
            id: 'custom-category',
            name: '自定义分类',
            color: '#123456',
            quickButtons: [
                {
                    id: 'saved-button',
                    name: '已保存按钮',
                    text: 'persisted-command',
                    color: '#abcdef',
                    action: 'fill',
                    appendCR: true,
                },
            ],
            commonCommands: [],
            scratchpad: 'persisted scratchpad',
            tempSnippets: [],
        },
    ],
}

const normalizedMixed = model.normalizeConfig(mixedConfig)
assert.equal(normalizedMixed.version, 2)
assert.equal(normalizedMixed.activeCategoryId, 'custom-category')
assert.equal(normalizedMixed.categories.length, 1)
assert.equal(normalizedMixed.categories[0].quickButtons[0].id, 'saved-button')
assert.equal(normalizedMixed.categories[0].scratchpad, 'persisted scratchpad')

const legacyOnly = model.normalizeConfig({
    quickButtons: mixedConfig.quickButtons,
})
assert.equal(legacyOnly.categories[0].quickButtons[0].id, 'legacy-button')

const newConfig = { categories: [{ id: 'new-config' }] }
const oldConfig = { categories: [{ id: 'old-config' }] }
assert.equal(
    config.selectPersistedConfig({
        commandWorkbench: newConfig,
        serialCommandSidebar: oldConfig,
    }, null),
    newConfig,
)
assert.equal(
    config.selectPersistedConfig({ serialCommandSidebar: oldConfig }, null),
    oldConfig,
)
assert.equal(
    config.selectPersistedConfig({
        commandWorkbench: {},
        serialCommandSidebar: oldConfig,
    }, null),
    oldConfig,
)

console.log('configuration persistence and migration tests passed')
