import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/react'
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

export const dragOver = (
  draggedOver: HTMLElement,
  direction: DragDropUtils.DragEnterDirection
) => {
  const clientX =
    100 + (direction === DragDropUtils.DragEnterDirection.LEFT ? 1 : 51)
  const left = 100
  const right = left + 100
  const dragOverEvent = createBubbledEvent('dragover', { clientX })
  jest
    .spyOn(DragDropUtils, 'getEventCurrentTargetDistances')
    .mockImplementationOnce(() => ({ left, right }))
  draggedOver.dispatchEvent(dragOverEvent)
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

  if (direction !== DragDropUtils.DragEnterDirection.AUTO) {
    dragOver(draggedOver, direction)
  } else {
    draggedOver.dispatchEvent(createBubbledEvent('dragover'))
  }

  jest.useRealTimers()
}

export const dragAndDrop = (
  startingNode: HTMLElement,
  endingNode: HTMLElement,
  direction: DragDropUtils.DragEnterDirection = DragDropUtils.DragEnterDirection
    .LEFT,
  options?: Partial<{ hideDragged: boolean }>
) => {
  const { hideDragged } = { hideDragged: true, ...options }
  dragEnter(startingNode, endingNode, direction)

  let targetElement: HTMLElement

  if (hideDragged) {
    targetElement = endingNode
  } else {
    targetElement = screen.getByTestId('drop-target')
    dragOver(targetElement, direction)
  }

  jest.useFakeTimers()

  targetElement.dispatchEvent(createBubbledEvent('drop'))

  act(() => {
    jest.advanceTimersByTime(1)
  })
  jest.useRealTimers()

  startingNode.dispatchEvent(createBubbledEvent('dragend'))
}
