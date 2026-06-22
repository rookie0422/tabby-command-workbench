export type SortDirection = 'horizontal' | 'vertical' | 'grid'

export interface SortableRect {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
}

export interface SortProbe {
    x: number
    y: number
    axis: 'horizontal' | 'vertical'
}

export interface DragPosition {
    left: number
    top: number
}

export interface SortMovement {
    deltaX: number
    deltaY: number
}

export function getEffectiveSortMovement (
    direction: SortDirection,
    pointerDeltaX: number,
    pointerDeltaY: number,
    visualDeltaX: number,
    visualDeltaY: number,
    epsilon = 0.5,
): SortMovement | null {
    const followsPointer = (pointerDelta: number, visualDelta: number): boolean => (
        Math.abs(visualDelta) >= epsilon
        && (Math.abs(pointerDelta) < epsilon || Math.sign(pointerDelta) === Math.sign(visualDelta))
    )
    if (direction === 'horizontal') {
        return followsPointer(pointerDeltaX, visualDeltaX)
            ? { deltaX: visualDeltaX, deltaY: 0 }
            : null
    }
    if (direction === 'vertical') {
        return followsPointer(pointerDeltaY, visualDeltaY)
            ? { deltaX: 0, deltaY: visualDeltaY }
            : null
    }

    const horizontalIntent = Math.abs(pointerDeltaX) >= Math.abs(pointerDeltaY) && pointerDeltaX !== 0
    if (horizontalIntent) {
        return followsPointer(pointerDeltaX, visualDeltaX)
            ? { deltaX: visualDeltaX, deltaY: 0 }
            : null
    }
    return followsPointer(pointerDeltaY, visualDeltaY)
        ? { deltaX: 0, deltaY: visualDeltaY }
        : null
}

export function clampGridDragPosition (
    slots: SortableRect[],
    draggedWidth: number,
    draggedHeight: number,
    desired: DragPosition,
    bounds: SortableRect,
): DragPosition {
    const maxTop = Math.max(bounds.top, bounds.bottom - draggedHeight)
    const top = Math.min(maxTop, Math.max(bounds.top, desired.top))
    if (!slots.length) {
        const maxLeft = Math.max(bounds.left, bounds.right - draggedWidth)
        return {
            left: Math.min(maxLeft, Math.max(bounds.left, desired.left)),
            top,
        }
    }

    const rows: Array<{ top: number, bottom: number, slots: SortableRect[] }> = []
    const orderedSlots = [...slots].sort((left, right) => left.top - right.top || left.left - right.left)
    for (const slot of orderedSlots) {
        const row = rows.find(candidate => Math.abs(candidate.top - slot.top) <= 2)
        if (row) {
            row.bottom = Math.max(row.bottom, slot.bottom)
            row.slots.push(slot)
        } else {
            rows.push({ top: slot.top, bottom: slot.bottom, slots: [slot] })
        }
    }

    const desiredCenterY = top + draggedHeight / 2
    const nearestRow = rows.reduce((nearest, row) => {
        const nearestCenter = (nearest.top + nearest.bottom) / 2
        const rowCenter = (row.top + row.bottom) / 2
        return Math.abs(rowCenter - desiredCenterY) < Math.abs(nearestCenter - desiredCenterY)
            ? row
            : nearest
    })
    const rowMinLeft = Math.max(bounds.left, Math.min(...nearestRow.slots.map(slot => slot.left)))
    const occupiedRight = Math.max(...nearestRow.slots.map(slot => slot.right))
    const rowMaxLeft = Math.max(
        rowMinLeft,
        Math.min(bounds.right - draggedWidth, occupiedRight - draggedWidth),
    )
    return {
        left: Math.min(rowMaxLeft, Math.max(rowMinLeft, desired.left)),
        top,
    }
}

export function getDirectionalSortProbe (
    dragged: SortableRect,
    direction: SortDirection,
    deltaX: number,
    deltaY: number,
    hysteresis = 6,
): SortProbe {
    const centerX = dragged.left + dragged.width / 2
    const centerY = dragged.top + dragged.height / 2
    const horizontalInset = Math.min(hysteresis, dragged.width / 2)
    const verticalInset = Math.min(hysteresis, dragged.height / 2)
    const horizontalProbe = deltaX < 0
        ? dragged.left + horizontalInset
        : deltaX > 0
            ? dragged.right - horizontalInset
            : centerX
    const verticalProbe = deltaY < 0
        ? dragged.top + verticalInset
        : deltaY > 0
            ? dragged.bottom - verticalInset
            : centerY

    if (direction === 'horizontal') {
        return { x: horizontalProbe, y: centerY, axis: 'horizontal' }
    }
    if (direction === 'vertical') {
        return { x: centerX, y: verticalProbe, axis: 'vertical' }
    }
    const useHorizontalEdge = Math.abs(deltaX) >= Math.abs(deltaY) && deltaX !== 0
    return useHorizontalEdge
        ? { x: horizontalProbe, y: centerY, axis: 'horizontal' }
        : { x: centerX, y: verticalProbe, axis: 'vertical' }
}

export function findSortAnchorIndex (
    siblings: SortableRect[],
    direction: SortDirection,
    probe: SortProbe,
): number {
    if (direction === 'horizontal') {
        return siblings.findIndex(rect => probe.x < rect.left + rect.width / 2)
    }
    if (direction === 'vertical') {
        return siblings.findIndex(rect => probe.y < rect.top + rect.height / 2)
    }
    if (!siblings.length) {
        return -1
    }

    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    siblings.forEach((rect, index) => {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const normalizedX = (probe.x - centerX) / Math.max(rect.width, 1)
        const normalizedY = (probe.y - centerY) / Math.max(rect.height, 1)
        const distance = normalizedX * normalizedX + normalizedY * normalizedY
        if (distance < nearestDistance) {
            nearestDistance = distance
            nearestIndex = index
        }
    })
    const nearest = siblings[nearestIndex]
    const centerX = nearest.left + nearest.width / 2
    const centerY = nearest.top + nearest.height / 2
    const insertBeforeNearest = probe.axis === 'horizontal'
        ? probe.x < centerX
        : probe.y < centerY
    return insertBeforeNearest ? nearestIndex : nearestIndex + 1
}
