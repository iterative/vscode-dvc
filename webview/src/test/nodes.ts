export const idToNode = (id: string) =>
  // eslint-disable-next-line unicorn/prefer-query-selector
  (id && document.getElementById(id)) || null

export const getParentElement = (element: HTMLElement, levels = 1) => {
  let parentElem = element
  for (let i = 0; i < levels; i++) {
    // eslint-disable-next-line testing-library/no-node-access
    parentElem = parentElem.parentElement || parentElem
  }
  return parentElem
}
