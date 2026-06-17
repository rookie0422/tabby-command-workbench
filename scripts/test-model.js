const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const ts = require('typescript')

// Register .ts extension so require('./constants') inside transpiled code works.
require.extensions['.ts'] = function (mod, filename) {
    const source = fs.readFileSync(filename, 'utf8')
    const output = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
            esModuleInterop: true,
        },
        fileName: filename,
    }).outputText
    mod._compile(output, filename)
}

// Patch resolution: Node won't try .ts when transpiled code does require("./constants").
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
    try {
        return originalResolve.call(this, request, parent, isMain, options)
    } catch (e) {
        // Only intercept bare relative/absolute specifiers – never node_modules.
        if (!request.startsWith('.') && !request.startsWith('/')) {
            throw e
        }
        try {
            return originalResolve.call(this, request + '.ts', parent, isMain, options)
        } catch (_) {
            try {
                return originalResolve.call(this, request + '/index.ts', parent, isMain, options)
            } catch (__) {
                throw e
            }
        }
    }
}

const model = require('../src/model.ts')
const { selectPersistedConfig } = require('../src/config.ts')
const { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, DEFAULT_SIDEBAR_WIDTH } = require('../src/constants.ts')

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
    selectPersistedConfig({
        commandWorkbench: newConfig,
        serialCommandSidebar: oldConfig,
    }, null),
    newConfig,
)
assert.equal(
    selectPersistedConfig({ serialCommandSidebar: oldConfig }, null),
    oldConfig,
)
assert.equal(
    selectPersistedConfig({
        commandWorkbench: {},
        serialCommandSidebar: oldConfig,
    }, null),
    oldConfig,
)

console.log('configuration persistence and migration tests passed')

// P0-2: empty / null / undefined config → returns valid default
const emptyResult = model.normalizeConfig({})
assert.equal(emptyResult.version, 2)
assert.equal(emptyResult.enabled, true)
assert.equal(emptyResult.categories.length, 2)
assert.ok(emptyResult.categories[0].quickButtons.length > 0)

const nullResult = model.normalizeConfig(null)
assert.equal(nullResult.version, 2)
assert.equal(nullResult.categories.length, 2)

const undefinedResult = model.normalizeConfig(undefined)
assert.equal(undefinedResult.version, 2)

// P0-2: corrupted config with missing required fields
const corrupted = model.normalizeConfig({
    categories: [{ id: 'broken', name: 'Test' }],
})
assert.equal(corrupted.version, 2)
const brokenCat = corrupted.categories[0]
assert.equal(brokenCat.id, 'broken')
assert.equal(brokenCat.name, 'Test')
assert.ok(Array.isArray(brokenCat.quickButtons))
assert.ok(Array.isArray(brokenCat.commonCommands))
assert.equal(typeof brokenCat.scratchpad, 'string')

// P0-2: empty categories list → fills defaults
const emptyCategories = model.normalizeConfig({ categories: [] })
assert.equal(emptyCategories.categories.length, 2)

console.log('P0-2 settings normalization tests passed')

// P1-6: tempSnippets → scratchpad migration
const tempSnippetsConfig = model.normalizeConfig({
    categories: [{
        id: 'migration-cat',
        name: 'Migration',
        tempSnippets: [
            { id: 'ts1', text: 'snippet-one', name: 'S1', color: '#000' },
            { id: 'ts2', text: 'snippet-two', name: 'S2', color: '#111' },
        ],
        scratchpad: '',
        quickButtons: [],
        commonCommands: [],
    }],
})
const migratedCat = tempSnippetsConfig.categories[0]
assert.equal(migratedCat.scratchpad, 'snippet-one\n\nsnippet-two')
assert.equal(migratedCat.tempSnippets.length, 2)
assert.equal(migratedCat.tempSnippets[0].text, 'snippet-one')

// P1-6: empty tempSnippets leaves scratchpad as-is
const noSnippetsConfig = model.normalizeConfig({
    categories: [{
        id: 'no-snippet-cat',
        scratchpad: 'existing text',
        tempSnippets: [],
        quickButtons: [],
        commonCommands: [],
    }],
})
assert.equal(noSnippetsConfig.categories[0].scratchpad, 'existing text')

console.log('P1-6 tempSnippets migration tests passed')

// P2-7: sidebarWidth clamp
const belowMin = model.normalizeConfig({ categories: [{ id: 'x' }], sidebarWidth: 200 })
assert.equal(belowMin.sidebarWidth, MIN_SIDEBAR_WIDTH)

const aboveMax = model.normalizeConfig({ categories: [{ id: 'x' }], sidebarWidth: 900 })
assert.equal(aboveMax.sidebarWidth, MAX_SIDEBAR_WIDTH)

const atMin = model.normalizeConfig({ categories: [{ id: 'x' }], sidebarWidth: MIN_SIDEBAR_WIDTH })
assert.equal(atMin.sidebarWidth, MIN_SIDEBAR_WIDTH)

const atMax = model.normalizeConfig({ categories: [{ id: 'x' }], sidebarWidth: MAX_SIDEBAR_WIDTH })
assert.equal(atMax.sidebarWidth, MAX_SIDEBAR_WIDTH)

const invalidValue = model.normalizeConfig({ categories: [{ id: 'x' }], sidebarWidth: NaN })
assert.equal(invalidValue.sidebarWidth, DEFAULT_SIDEBAR_WIDTH)

const zeroValue = model.normalizeConfig({ categories: [{ id: 'x' }], sidebarWidth: 0 })
assert.equal(zeroValue.sidebarWidth, DEFAULT_SIDEBAR_WIDTH)

const missingWidth = model.normalizeConfig({ categories: [{ id: 'x' }] })
assert.equal(missingWidth.sidebarWidth, DEFAULT_SIDEBAR_WIDTH)

// P2-7: legacy config migration preserves enabled/sidebarOpen
const legacyEnabled = model.normalizeConfig({ quickButtons: [], enabled: false })
assert.equal(legacyEnabled.enabled, false)

const legacyOpen = model.normalizeConfig({ quickButtons: [], sidebarOpen: false })
assert.equal(legacyOpen.sidebarOpen, false)

console.log('P2-7 extended model tests passed')
