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
const sequence = require('../src/commandSequence.ts')
const sortable = require('../src/sortableGeometry.ts')
const { selectPersistedConfig } = require('../src/config.ts')
const {
    MIN_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
    DEFAULT_SIDEBAR_WIDTH,
    MAX_SEQUENCE_DELAY_MS,
} = require('../src/constants.ts')

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
assert.equal(normalizedMixed.categories[0].quickButtons[0].dangerAccepted, false)

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

const params = sequence.extractTemplateParameters('adb connect {{ip}}\nadb -s {{ip}} shell\nssh {{user}}@{{host}}')
assert.deepEqual(params, ['ip', 'user', 'host'])

const rendered = sequence.renderTemplate('adb connect {{ip}}\nadb -s {{ip}} shell', { ip: '192.168.1.10:5555' })
assert.equal(rendered, 'adb connect 192.168.1.10:5555\nadb -s 192.168.1.10:5555 shell')

const fillText = sequence.stripDelaySteps('adb connect {{ip}}\n{{delay:2000}}\nadb -s {{ip}} shell')
assert.equal(fillText, 'adb connect {{ip}}\nadb -s {{ip}} shell')
assert.equal(sequence.hasDelayStep('echo before\n{{delay:2s}}\necho after'), true)
assert.equal(sequence.hasDelayStep('echo "{{delay:2s}}"'), false)

const parsed = sequence.parseCommandSequence('adb reboot bootloader\n{{delay:5s}}\nfastboot devices')
assert.deepEqual(parsed.errors, [])
assert.deepEqual(parsed.steps, [
    { type: 'command', text: 'adb reboot bootloader' },
    { type: 'delay', ms: 5000 },
    { type: 'command', text: 'fastboot devices' },
])

const parsedMs = sequence.parseCommandSequence('echo before\n{{delay 250}}\necho after')
assert.deepEqual(parsedMs.errors, [])
assert.equal(parsedMs.steps[1].ms, 250)

const invalidDelay = sequence.parseCommandSequence('{{delay:bad}}')
assert.equal(invalidDelay.steps.length, 0)
assert.equal(invalidDelay.errors.length, 1)

const tooLongDelay = sequence.parseCommandSequence(`{{delay:${MAX_SEQUENCE_DELAY_MS + 1}}}`)
assert.equal(tooLongDelay.errors.length, 1)

assert.equal(sequence.hasDangerousCommand('adb reboot'), true)
assert.equal(sequence.hasDangerousCommand('fastboot flash boot boot.img'), true)
assert.equal(sequence.hasDangerousCommand('pm clear com.example.app'), true)
assert.equal(sequence.hasDangerousCommand('echo harmless'), false)

console.log('command template and sequence tests passed')

const rect = (left, top, width, height) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
})

// Directional edge probes must stay reachable when source and target sizes differ.
const longAtLeft = rect(0, 0, 100, 36)
const shortFirst = rect(0, 0, 40, 36)
const leftProbe = sortable.getDirectionalSortProbe(longAtLeft, 'horizontal', -10, 0)
assert.equal(sortable.findSortAnchorIndex([shortFirst], 'horizontal', leftProbe), 0)

const longAtRight = rect(200, 0, 100, 36)
const shortLast = rect(260, 0, 40, 36)
const rightProbe = sortable.getDirectionalSortProbe(longAtRight, 'horizontal', 10, 0)
assert.equal(sortable.findSortAnchorIndex([shortLast], 'horizontal', rightProbe), -1)

// Equal-size grids must still be able to reach both ends despite hysteresis.
const gridAtLeft = rect(0, 0, 80, 38)
const gridFirst = rect(0, 0, 80, 38)
assert.equal(
    sortable.findSortAnchorIndex(
        [gridFirst],
        'grid',
        sortable.getDirectionalSortProbe(gridAtLeft, 'grid', -8, 0),
    ),
    0,
)
const gridAtRight = rect(220, 0, 80, 38)
const gridLast = rect(220, 0, 80, 38)
assert.equal(
    sortable.findSortAnchorIndex(
        [gridLast],
        'grid',
        sortable.getDirectionalSortProbe(gridAtRight, 'grid', 8, 0),
    ),
    1,
)

// Vertical lists use the leading/trailing edge as well.
const tallAtTop = rect(0, 0, 200, 80)
const shortTop = rect(0, 0, 200, 30)
assert.equal(
    sortable.findSortAnchorIndex(
        [shortTop],
        'vertical',
        sortable.getDirectionalSortProbe(tallAtTop, 'vertical', 0, -8),
    ),
    0,
)
const tallAtBottom = rect(0, 120, 200, 80)
const shortBottom = rect(0, 170, 200, 30)
assert.equal(
    sortable.findSortAnchorIndex(
        [shortBottom],
        'vertical',
        sortable.getDirectionalSortProbe(tallAtBottom, 'vertical', 0, 8),
    ),
    -1,
)

// Hysteresis delays a swap by 6px without making the target unreachable.
const target = rect(80, 0, 30, 36) // center x = 95
assert.equal(
    sortable.findSortAnchorIndex(
        [target],
        'horizontal',
        sortable.getDirectionalSortProbe(rect(14, 0, 80, 36), 'horizontal', 2, 0),
    ),
    0,
)
assert.equal(
    sortable.findSortAnchorIndex(
        [target],
        'horizontal',
        sortable.getDirectionalSortProbe(rect(22, 0, 80, 36), 'horizontal', 2, 0),
    ),
    -1,
)

// Boundary reachability holds across practical source/target size combinations.
for (const sourceWidth of [28, 40, 80, 140]) {
    for (const targetWidth of [20, 40, 100]) {
        const sourceAtStart = rect(0, 0, sourceWidth, 36)
        const targetAtStart = rect(0, 0, targetWidth, 36)
        assert.equal(
            sortable.findSortAnchorIndex(
                [targetAtStart],
                'horizontal',
                sortable.getDirectionalSortProbe(sourceAtStart, 'horizontal', -1, 0),
            ),
            0,
        )

        const sourceAtEnd = rect(300 - sourceWidth, 0, sourceWidth, 36)
        const targetAtEnd = rect(300 - targetWidth, 0, targetWidth, 36)
        assert.equal(
            sortable.findSortAnchorIndex(
                [targetAtEnd],
                'horizontal',
                sortable.getDirectionalSortProbe(sourceAtEnd, 'horizontal', 1, 0),
            ),
            -1,
        )
    }
}

// Grid movement uses the dominant axis, so the same column can reach first/last rows.
const gridTop = rect(0, 0, 80, 38)
assert.equal(
    sortable.findSortAnchorIndex(
        [gridTop],
        'grid',
        sortable.getDirectionalSortProbe(gridTop, 'grid', 0, -8),
    ),
    0,
)
const gridBottom = rect(0, 82, 80, 38)
assert.equal(
    sortable.findSortAnchorIndex(
        [gridBottom],
        'grid',
        sortable.getDirectionalSortProbe(gridBottom, 'grid', 0, 8),
    ),
    1,
)

// Partially filled rows expose only occupied grid slots, never trailing empty cells.
const fourColumnSevenItems = [
    rect(0, 0, 80, 38),
    rect(88, 0, 80, 38),
    rect(176, 0, 80, 38),
    rect(264, 0, 80, 38),
    rect(0, 44, 80, 38),
    rect(88, 44, 80, 38),
    rect(176, 44, 80, 38),
]
assert.deepEqual(
    sortable.clampGridDragPosition(
        fourColumnSevenItems,
        80,
        38,
        { left: 264, top: 44 },
        rect(0, 0, 344, 82),
    ),
    { left: 176, top: 44 },
)

const fourColumnFiveItems = fourColumnSevenItems.slice(0, 5)
assert.deepEqual(
    sortable.clampGridDragPosition(
        fourColumnFiveItems,
        80,
        38,
        { left: 264, top: 44 },
        rect(0, 0, 344, 82),
    ),
    { left: 0, top: 44 },
)

// Full rows still expose their complete horizontal range.
const fourColumnEightItems = [...fourColumnSevenItems, rect(264, 44, 80, 38)]
assert.deepEqual(
    sortable.clampGridDragPosition(
        fourColumnEightItems,
        80,
        38,
        { left: 264, top: 44 },
        rect(0, 0, 344, 82),
    ),
    { left: 264, top: 44 },
)

// Pointer motion into an invalid empty slot must not sort when the entity is clamped in place.
assert.equal(
    sortable.getEffectiveSortMovement('grid', 20, 0, 0, 0),
    null,
)
assert.equal(
    sortable.getEffectiveSortMovement('horizontal', 20, 0, 0, 0),
    null,
)

// Grid keeps pointer intent as the active axis while using actual entity displacement.
assert.deepEqual(
    sortable.getEffectiveSortMovement('grid', 1, 12, -88, 8),
    { deltaX: 0, deltaY: 8 },
)
assert.deepEqual(
    sortable.getEffectiveSortMovement('grid', 12, 1, 8, 44),
    { deltaX: 8, deltaY: 0 },
)

console.log('sortable geometry tests passed')
