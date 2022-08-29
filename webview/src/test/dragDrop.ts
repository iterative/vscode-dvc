import { act } from 'react-dom/test-utils'
import * as DragDropUtils from '../shared/components/dragDrop/util'
import { idToNode } from '../util/helpers'

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

const getAxis = (direction: DragDropUtils.DragEnterDirection) =>
  [
    DragDropUtils.DragEnterDirection.LEFT,
    DragDropUtils.DragEnterDirection.RIGHT
  ].includes(direction)
    ? 'clientX'
    : 'clientY'

export const dragEnter = (
  dragged: HTMLElement,
  draggedOverId: string,
  direction: DragDropUtils.DragEnterDirection
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
    if (direction !== DragDropUtils.DragEnterDirection.AUTO) {
      const left = 100
      const right = left + 100
      const top = 100
      const bottom = top + 100

      jest
        .spyOn(DragDropUtils, 'getEventCurrentTargetDistances')
        .mockImplementationOnce(() => ({ bottom, left, right, top }))

      const clientPositionAxis = getAxis(direction)

      const clientPosition =
        100 +
        ([
          DragDropUtils.DragEnterDirection.LEFT,
          DragDropUtils.DragEnterDirection.TOP
        ].includes(direction)
          ? 1
          : 51)

      const dragOverEvent = createBubbledEvent('dragover', {
        [clientPositionAxis]: clientPosition
      })

      draggedOver?.dispatchEvent(dragOverEvent)
      jest.advanceTimersByTime(1)
    } else {
      draggedOver?.dispatchEvent(createBubbledEvent('dragover'))
    }
  })

  jest.useRealTimers()
}
export const dragAndDrop = (
  startingNode: HTMLElement,
  endingNode: HTMLElement,
  direction: DragDropUtils.DragEnterDirection = DragDropUtils.DragEnterDirection
    .LEFT
) => {
  // When showing element on drag, the dragged over element is being recreacted to be wrapped in another element, thus the endingNode does not exist as is in the document
  const endingNodeId = endingNode.id
  dragEnter(startingNode, endingNodeId, direction)

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
