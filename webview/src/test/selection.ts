export const createWindowTextSelection = (
  nodeValue: string | null,
  offset = 0
) => {
  window.getSelection = () => {
    return {
      anchorOffset: 1,
      focusNode: nodeValue ? ({ nodeValue } as Node) : null,
      focusOffset: 1 + offset
    } as Selection
  }
}

export const clearSelection = () => createWindowTextSelection(null)
