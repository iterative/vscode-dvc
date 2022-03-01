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
}
