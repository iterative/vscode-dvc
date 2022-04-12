import { act } from 'react-dom/test-utils'
import * as DragDropUtils from '../shared/components/dragDrop/util'

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

export const dragEnter = (
  dragged: HTMLElement,
  draggedOver: HTMLElement,
  direction: DragDropUtils.DragEnterDirection
) => {
  jest.useFakeTimers()
  dragged.dispatchEvent(createBubbledEvent('dragstart'))
  act(() => {
    jest.advanceTimersByTime(1)
  })

  draggedOver.dispatchEvent(createBubbledEvent('dragenter'))

  const clientX =
    100 + (direction === DragDropUtils.DragEnterDirection.LEFT ? 1 : 51)
  const left = 100
  const right = left + 100
  const dragOverEvent = createBubbledEvent('dragover', { clientX })
  jest
    .spyOn(DragDropUtils, 'getEventCurrentTargetDistances')
    .mockImplementationOnce(() => ({ left, right }))
  draggedOver.dispatchEvent(dragOverEvent)
  jest.useRealTimers()
}

export const dragAndDrop = (
  startingNode: HTMLElement,
  endingNode: HTMLElement,
  direction: DragDropUtils.DragEnterDirection = DragDropUtils.DragEnterDirection
    .LEFT
) => {
  startingNode.dispatchEvent(createBubbledEvent('dragstart'))
  dragEnter(startingNode, endingNode, direction)

  jest.useFakeTimers()

  endingNode.dispatchEvent(createBubbledEvent('drop'))

  act(() => {
    jest.advanceTimersByTime(1)
  })
  jest.useRealTimers()

  startingNode.dispatchEvent(createBubbledEvent('dragend'))
}
