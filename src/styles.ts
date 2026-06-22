export const QUICK_SHELF_STYLES = `
    .quick-shelf, .quick-shelf * { box-sizing: border-box; }
    body.command-workbench-docked app-root {
        width: 100vw !important;
        max-width: 100vw !important;
        min-width: 0 !important;
        overflow: hidden !important;
    }
    body.command-workbench-docked:not(.command-workbench-tabs-vertical) app-root > .content {
        width: 100vw !important;
        max-width: 100vw !important;
        overflow: hidden !important;
    }
    body.command-workbench-docked:not(.command-workbench-tabs-vertical) app-root > .content > .tab-bar {
        width: 100vw !important;
        max-width: 100vw !important;
    }
    body.command-workbench-docked:not(.command-workbench-tabs-vertical) app-root > .content > .content {
        width: calc(100vw - var(--command-workbench-width, 390px)) !important;
        max-width: calc(100vw - var(--command-workbench-width, 390px)) !important;
        min-width: 0 !important;
        overflow: hidden !important;
        transition: width .14s ease, max-width .14s ease;
    }
    body.command-workbench-docked.command-workbench-tabs-vertical app-root > .content {
        width: calc(100vw - var(--command-workbench-width, 390px)) !important;
        max-width: calc(100vw - var(--command-workbench-width, 390px)) !important;
        min-width: 0 !important;
        overflow: hidden !important;
        transition: width .14s ease, max-width .14s ease;
    }
    body.command-workbench-docked.command-workbench-tabs-vertical app-root > .content > .tab-bar {
        width: auto !important;
        max-width: 40vw !important;
        flex: 0 0 auto !important;
    }
    body.command-workbench-docked.command-workbench-tabs-vertical app-root > .content > .content {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
    }
    body.command-workbench-docked app-root > .content > .content > .content-tab {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
    }
    body.command-workbench-docked tab-body,
    body.command-workbench-docked split-tab,
    body.command-workbench-docked base-terminal-tab,
    body.command-workbench-docked .content,
    body.command-workbench-docked .xterm,
    body.command-workbench-docked .xterm-screen,
    body.command-workbench-docked .xterm-viewport {
        max-width: 100% !important;
        overflow: hidden !important;
    }
    body.command-workbench-resizing,
    body.command-workbench-resizing * {
        cursor: col-resize !important;
        user-select: none !important;
    }
    body.command-workbench-resizing app-root > .content > .content {
        transition: none !important;
    }
    body.command-workbench-resizing.command-workbench-tabs-vertical app-root > .content {
        transition: none !important;
    }
    body.command-workbench-sorting,
    body.command-workbench-sorting * {
        cursor: grabbing !important;
        user-select: none !important;
    }
    .quick-shelf {
        --shelf-width: 390px;
        position: fixed; top: 42px; right: 0; bottom: 0; z-index: 10000;
        display: flex; width: min(var(--shelf-width), calc(100vw - 20px));
        flex-direction: column; overflow: hidden;
        container-type: inline-size;
        border-left: 1px solid rgba(148, 163, 184, .28); border-radius: 0;
        color: var(--theme-text-color, #e5e7eb); background: #0b1424;
        box-shadow: -14px 0 30px rgba(0, 0, 0, .28);
        font-family: Inter, "Segoe UI", sans-serif; -webkit-app-region: no-drag;
    }
    .quick-shelf__resize-handle {
        position: absolute; top: 0; bottom: 0; left: -4px; z-index: 3;
        width: 8px; cursor: col-resize; touch-action: none;
    }
    .quick-shelf__resize-handle::before {
        content: ""; position: absolute; top: 0; bottom: 0; left: 3px;
        width: 1px; background: rgba(148, 163, 184, .25);
    }
    .quick-shelf__resize-handle:hover::before,
    body.command-workbench-resizing .quick-shelf__resize-handle::before {
        left: 2px; width: 3px; background: #38bdf8;
    }
    .quick-shelf-toggle {
        position: fixed; top: 50%; right: 0; z-index: 10000;
        display: flex; min-height: 112px; padding: 12px 8px;
        align-items: center; justify-content: center;
        border: 1px solid rgba(148, 163, 184, .32); border-right: 0;
        border-radius: 9px 0 0 9px; color: #e5e7eb; background: #172033;
        cursor: pointer; writing-mode: vertical-rl; letter-spacing: 1px;
        -webkit-app-region: no-drag;
    }
    .quick-shelf__header {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 12px 14px; border-bottom: 1px solid rgba(148, 163, 184, .16);
    }
    .quick-shelf__heading { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
    .quick-shelf__heading strong { font-size: 15px; }
    .quick-shelf__heading span { overflow: hidden; color: #94a3b8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .quick-shelf__heading span.is-error { color: #fca5a5; }
    .quick-shelf__header-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 6px; }
    .quick-shelf__category-wrap {
        display: grid; grid-template-columns: minmax(0, 1fr) 34px; gap: 8px;
        padding: 9px 12px; border-bottom: 1px solid rgba(148, 163, 184, .16);
    }
    .quick-shelf__categories {
        display: flex; min-width: 0; gap: 6px;
        overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
    }
    .quick-shelf__category {
        position: relative; flex: 0 0 auto; min-height: 36px; padding: 6px 13px;
        border: 1px solid rgba(148, 163, 184, .22); border-radius: 999px;
        color: #cbd5e1; background: #182338; cursor: grab;
        user-select: none; -webkit-user-select: none;
        transition: border-color .12s ease, background-color .12s ease;
    }
    .quick-shelf__category.is-active {
        color: #fff; border-color: var(--category-color);
        box-shadow: inset 0 -3px 0 var(--category-color);
    }
    .quick-shelf__category.is-dragging { z-index: 1; cursor: grabbing; }
    .quick-shelf__category-editor {
        display: grid; grid-template-columns: minmax(0, 1fr) 74px; gap: 8px;
        padding: 10px 12px; border-bottom: 1px solid rgba(148, 163, 184, .16);
        background: #111b2c;
    }
    .quick-shelf__category-editor .quick-shelf__actions { grid-column: 1 / -1; }
    .quick-shelf__body {
        display: flex; min-height: 0; flex: 1; padding: clamp(8px, 2.5cqi, 12px);
        flex-direction: column; overflow: hidden;
    }
    .quick-shelf__section { flex: 0 0 auto; margin-bottom: 12px; }
    .quick-shelf__section.is-quick,
    .quick-shelf__section.is-common {
        display: flex; min-height: 0; flex: 0 1 auto; flex-direction: column;
    }
    .quick-shelf__section.is-scratch {
        display: flex; min-height: 120px; flex: 1 1 auto;
        margin-bottom: 0; flex-direction: column;
    }
    .quick-shelf__section-header {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        margin-bottom: 8px;
    }
    .quick-shelf__section-title { display: flex; align-items: center; gap: 7px; }
    .quick-shelf__section-title strong { font-size: 13px; }
    .quick-shelf__section-title span {
        min-width: 20px; padding: 1px 6px; border-radius: 999px;
        color: #94a3b8; background: #1e293b; font-size: 10px; text-align: center;
    }
    .quick-shelf__section-title small { color: #64748b; font-size: 9px; font-weight: 400; }
    .quick-shelf__quick-grid {
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px;
        grid-auto-rows: 38px; max-height: 126px; align-content: start;
        overflow-x: hidden; overflow-y: auto; padding-right: 2px;
    }
    .quick-shelf__quick-card {
        position: relative; min-width: 0; overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--item-color) 45%, #334155);
        border-radius: 8px; background: #121d30; cursor: grab;
        user-select: none; -webkit-user-select: none;
    }
    .quick-shelf__quick-card.is-send {
        border-color: color-mix(in srgb, var(--item-color) 70%, #f59e0b);
        background: #172033;
    }
    .quick-shelf__quick-card.is-dangerous {
        border-color: #ef4444; box-shadow: inset 0 0 0 1px rgba(239, 68, 68, .25);
    }
    .quick-shelf__quick-execute {
        display: flex; width: 100%; min-height: 38px; padding: 4px 6px;
        align-items: center; justify-content: center; flex-direction: column; gap: 1px;
        border: 0; color: #f8fafc; background: transparent; cursor: pointer;
        text-align: center; font-size: 11px; font-weight: 700; line-height: 1.2;
    }
    .quick-shelf__quick-label {
        display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .quick-shelf__quick-mode {
        color: #94a3b8; font-size: 9px; font-weight: 600;
    }
    .quick-shelf__quick-card.is-send .quick-shelf__quick-mode { color: #fbbf24; }
    .quick-shelf__quick-card.is-dangerous .quick-shelf__quick-mode { color: #fca5a5; }
    .quick-shelf__list {
        display: flex; max-height: 190px; padding-right: 2px;
        flex-direction: column; gap: 5px; overflow-x: hidden; overflow-y: auto;
    }
    .quick-shelf__item-card {
        display: flex; min-width: 0; padding: 10px; flex-direction: column; gap: 8px;
        border: 1px solid rgba(148, 163, 184, .17); border-left: 4px solid var(--item-color);
        border-radius: 8px; background: #111b2c;
    }
    .quick-shelf__item-card > strong { font-size: 12px; }
    .quick-shelf__item-card pre {
        max-height: 120px; margin: 0; overflow: auto; color: #cbd5e1;
        font: 11px/1.5 "JetBrains Mono", Consolas, monospace;
        white-space: pre-wrap; word-break: break-word;
    }
    .quick-shelf__item-card.is-command {
        min-height: 34px; padding: 6px 9px; justify-content: center;
        gap: 0; cursor: grab; user-select: none; -webkit-user-select: none;
        transition: border-color .16s ease, background .16s ease;
    }
    .quick-shelf__quick-card.is-dragging,
    .quick-shelf__item-card.is-command.is-dragging { z-index: 1; cursor: grabbing; }
    .quick-shelf__quick-card.is-dragging *,
    .quick-shelf__item-card.is-command.is-dragging * { cursor: grabbing !important; }
    .quick-shelf__item-card.is-command:hover,
    .quick-shelf__item-card.is-command:focus-visible {
        border-color: var(--item-color); background: #16243a; outline: none;
    }
    .quick-shelf__item-card.is-command pre {
        max-height: none; color: #f8fafc; font-size: 12px; font-weight: 600; line-height: 1.45;
    }
    .quick-shelf__description { margin: -3px 0 0; color: #94a3b8; font-size: 11px; }
    .quick-shelf__scratchpad { display: flex; min-height: 0; flex: 1; }
    .quick-shelf__scratchpad textarea {
        width: 100%; height: 100%; min-height: 180px;
        padding: 12px; resize: none;
        border: 1px solid rgba(148, 163, 184, .3); border-radius: 8px;
        color: #f8fafc; background: #0b1424;
        font: 13px/1.65 "JetBrains Mono", Consolas, monospace;
        tab-size: 4;
    }
    .quick-shelf__actions { display: flex; flex-wrap: wrap; gap: 5px; }
    .quick-shelf__button, .quick-shelf__icon-button {
        min-height: 29px; padding: 4px 9px;
        border: 1px solid rgba(148, 163, 184, .22); border-radius: 6px;
        color: #cbd5e1; background: #1b2940; cursor: pointer; font-size: 11px;
    }
    .quick-shelf__button.is-primary { color: #052e16; border-color: #22c55e; background: #22c55e; font-weight: 700; }
    .quick-shelf__button.is-danger { color: #fecaca; border-color: rgba(239, 68, 68, .55); background: rgba(127, 29, 29, .55); }
    .quick-shelf__icon-button { min-width: 29px; padding: 3px 7px; font-size: 14px; line-height: 1; }
    .quick-shelf__template-tools { display: flex; flex-wrap: wrap; gap: 6px; }
    .quick-shelf__template-tools .quick-shelf__hint { flex: 1 0 100%; color: #94a3b8; font-size: 11px; line-height: 1.45; }
    .quick-shelf__field { display: flex; min-width: 0; flex-direction: column; gap: 4px; color: #aebbd0; font-size: 10px; }
    .quick-shelf__field input, .quick-shelf__field textarea, .quick-shelf__field select {
        width: 100%; min-height: 32px; padding: 6px 8px;
        border: 1px solid rgba(148, 163, 184, .26); border-radius: 6px;
        color: #f8fafc; background: #0b1424; font: inherit;
    }
    .quick-shelf__field textarea { min-height: 78px; resize: vertical; font-family: Consolas, monospace; }
    .quick-shelf__field input[type="color"] { padding: 3px; }
    .quick-shelf__checkbox { display: flex; align-items: center; gap: 5px; color: #cbd5e1; font-size: 11px; }
    .quick-shelf__status {
        position: absolute; right: 12px; bottom: 12px; z-index: 2;
        padding: 8px 11px; border-radius: 7px; opacity: 0; pointer-events: none;
        color: #dcfce7; background: #166534; transform: translateY(8px);
        transition: opacity .15s ease, transform .15s ease; font-size: 11px;
    }
    .quick-shelf__status.is-visible { opacity: 1; transform: translateY(0); }
    .quick-shelf__status.is-error { color: #fee2e2; background: #991b1b; }
    .quick-shelf__context-menu {
        position: fixed; z-index: 10020; display: flex; min-width: 150px; padding: 5px;
        flex-direction: column; gap: 2px; border: 1px solid rgba(148, 163, 184, .28);
        border-radius: 8px; color: #e5e7eb; background: #111b2c;
        box-shadow: 0 16px 40px rgba(0, 0, 0, .52); -webkit-app-region: no-drag;
    }
    .quick-shelf__context-menu button {
        min-height: 34px; padding: 7px 10px; border: 0; border-radius: 5px;
        color: #dbe5f3; background: transparent; cursor: pointer; text-align: left;
        font: 12px/1.3 Inter, "Segoe UI", sans-serif;
    }
    .quick-shelf__context-menu button:hover,
    .quick-shelf__context-menu button:focus-visible { background: #24334d; outline: none; }
    .quick-shelf__context-menu button.is-danger { color: #fca5a5; }
    .quick-shelf__context-menu button.is-danger:hover { background: rgba(127, 29, 29, .55); }
    .quick-shelf__modal-backdrop {
        position: fixed; inset: 0; z-index: 10030; display: grid; padding: 24px;
        place-items: center; background: rgba(2, 6, 23, .68);
        backdrop-filter: blur(3px); -webkit-app-region: no-drag;
    }
    .quick-shelf__modal {
        display: flex; width: min(520px, calc(100vw - 32px)); max-height: min(720px, calc(100vh - 32px));
        flex-direction: column; overflow: hidden;
        border: 1px solid rgba(148, 163, 184, .34); border-radius: 12px;
        color: #e5e7eb; background: #101a2b;
        box-shadow: 0 24px 80px rgba(0, 0, 0, .62);
        font-family: Inter, "Segoe UI", sans-serif;
    }
    .quick-shelf__modal-header {
        display: flex; padding: 12px 14px; align-items: center; justify-content: space-between;
        border-bottom: 1px solid rgba(148, 163, 184, .2);
    }
    .quick-shelf__modal-header strong { font-size: 15px; }
    .quick-shelf__modal-body { overflow-y: auto; padding: 14px; }
    .quick-shelf__modal .quick-shelf__item-card {
        padding: 14px; gap: 12px; border-left-width: 1px; background: #111d31;
    }
    .quick-shelf__modal .quick-shelf__category-editor {
        display: grid; grid-template-columns: minmax(0, 1fr) 90px; gap: 12px;
        padding: 14px; border: 1px solid rgba(148, 163, 184, .17);
        border-radius: 8px; background: #111d31;
    }
    .quick-shelf__modal .quick-shelf__field { gap: 6px; font-size: 12px; }
    .quick-shelf__modal .quick-shelf__field input,
    .quick-shelf__modal .quick-shelf__field textarea,
    .quick-shelf__modal .quick-shelf__field select { min-height: 38px; font-size: 13px; }
    .quick-shelf__modal .quick-shelf__field textarea { min-height: 130px; }
    .quick-shelf__modal .quick-shelf__actions { margin-top: 4px; }
    .quick-shelf__modal .quick-shelf__button { min-height: 34px; padding-inline: 13px; font-size: 12px; }
    .quick-shelf button:hover { filter: brightness(1.14); }
    .quick-shelf button:focus-visible, .quick-shelf input:focus-visible,
    .quick-shelf textarea:focus-visible, .quick-shelf select:focus-visible,
    .quick-shelf-toggle:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
    @container (max-width: 350px) {
        .quick-shelf__quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-height: 680px) {
        .quick-shelf__header { padding-block: 8px; }
        .quick-shelf__category-wrap { padding-block: 6px; }
        .quick-shelf__section { margin-bottom: 8px; }
        .quick-shelf__section-header { margin-bottom: 5px; }
    }
`
