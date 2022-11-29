import { act } from 'react-dom/test-utils'
import { DragEnterDirection } from '../shared/components/dragDrop/util'
import { idToNode } from '../util/helpers'

export type SpyableEventCurrentTargetDistances =
  typeof import('../shared/components/dragDrop/currentTarget')

const testStorage = new Map()

export const createBubbledEvent = (type: string, props = {}) => {
  const event = new Event(type, {
    bubbles: true
  })
  Object.assign(event, props)
  Object.assign(event, {
    dataTransfer: {
      getData: (key: string) => testStorage.get(key),
      setData: (key: string, value: Object) => testStorage.set(key, value)
    }
  })
  return event
}

const getAxis = (direction: DragEnterDirection) =>
  [DragEnterDirection.LEFT, DragEnterDirection.RIGHT].includes(direction)
    ? 'clientX'
    : 'clientY'

const mockSingleCallToGetter = (
  spyableGetter: SpyableEventCurrentTargetDistances | undefined,
  distances: { bottom: number; left: number; right: number; top: number }
) => {
  if (spyableGetter) {
    jest
      .spyOn(spyableGetter, 'getEventCurrentTargetDistances')
      .mockImplementationOnce(() => distances)
  }
}

export const dragEnter = (
  dragged: HTMLElement,
  draggedOverId: string,
  direction: DragEnterDirection,
  spyableGetter?: SpyableEventCurrentTargetDistances
) => {
  jest.useFakeTimers()
  act(() => {
    dragged.dispatchEvent(createBubbledEvent('dragstart'))
  })

  act(() => {
    jest.advanceTimersByTime(1)
  })

  let draggedOver = idToNode(draggedOverId)

  act(() => {
    draggedOver?.dispatchEvent(createBubbledEvent('dragenter'))
  })
  draggedOver = idToNode(draggedOverId)

  act(() => {
    if (direction === DragEnterDirection.AUTO) {
      draggedOver?.dispatchEvent(createBubbledEvent('dragover'))
    } else {
      const left = 100
      const right = left + 100
      const top = 100
      const bottom = top + 100

      mockSingleCallToGetter(spyableGetter, { bottom, left, right, top })

      const clientPositionAxis = getAxis(direction)

      const clientPosition =
        100 +
        ([DragEnterDirection.LEFT, DragEnterDirection.TOP].includes(direction)
          ? 1
          : 51)

      const dragOverEvent = createBubbledEvent('dragover', {
        [clientPositionAxis]: clientPosition
      })

      draggedOver?.dispatchEvent(dragOverEvent)
      jest.advanceTimersByTime(1)
    }
  })

  jest.useRealTimers()
}

export const dragLeave = (draggedOver: HTMLElement) => {
  jest.useFakeTimers()
  act(() => {
    draggedOver.dispatchEvent(createBubbledEvent('dragleave'))
  })

  act(() => {
    jest.advanceTimersByTime(501)
  })
  jest.useRealTimers()
}

export const dragAndDrop = (
  startingNode: HTMLElement,
  endingNode: HTMLElement,
  direction: DragEnterDirection = DragEnterDirection.LEFT,
  spyableModule?: SpyableEventCurrentTargetDistances
) => {
  // When showing element on drag, the dragged over element is being recreated to be wrapped in another element, thus the endingNode does not exist as is in the document
  const endingNodeId = endingNode.id
  dragEnter(startingNode, endingNodeId, direction, spyableModule)

  jest.useFakeTimers()
  act(() => {
    jest.advanceTimersByTime(1)
    const endingNodeWithId = idToNode(endingNodeId)
    endingNodeWithId?.dispatchEvent(createBubbledEvent('drop'))
    jest.advanceTimersByTime(1)
    startingNode.dispatchEvent(createBubbledEvent('dragend'))
  })

  jest.useRealTimers()
}
