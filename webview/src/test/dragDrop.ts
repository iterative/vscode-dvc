import { act } from '@testing-library/react'

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

export const dragAndDrop = (
  startingNode: HTMLElement,
  endingNode: HTMLElement
) => {
  startingNode.dispatchEvent(createBubbledEvent('dragstart'))

  endingNode.dispatchEvent(createBubbledEvent('drop'))

  startingNode.dispatchEvent(createBubbledEvent('dragend'))
}

export const dragEnter = (
  startingNode: HTMLElement,
  overNode: HTMLElement,
  advanceTimers?: boolean
) => {
  act(() => {
    startingNode.dispatchEvent(createBubbledEvent('dragstart'))
    advanceTimers && jest.advanceTimersByTime(1)

    overNode.dispatchEvent(createBubbledEvent('dragenter'))
  })
}
