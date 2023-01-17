export const cond: <T = void, F = void>(
  condition: boolean,
  ifTrue: () => T,
  ifFalse: () => F
) => T | F = (condition, ifTrue, ifFalse) => (condition ? ifTrue() : ifFalse())

export const idToNode = (id: string) =>
  // eslint-disable-next-line unicorn/prefer-query-selector
  (id && document.getElementById(id)) || null

export const isTooltip = (el: Element, parentElements: string[]) => {
  let currentNode = el
  while (!parentElements.includes(currentNode.nodeName)) {
    if (
      !!currentNode.className.toLocaleLowerCase &&
      currentNode.className.toLocaleLowerCase().includes('tooltip')
    ) {
      return true
    }
    currentNode = currentNode.parentElement || currentNode
  }
  return false
}
