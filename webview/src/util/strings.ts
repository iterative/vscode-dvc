export const isSelecting = (text: string[]) => {
  const selection = window.getSelection()

  return (
    text.includes(selection?.focusNode?.nodeValue || '') &&
    selection?.anchorOffset !== selection?.focusOffset
  )
}
