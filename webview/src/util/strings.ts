export const pluralize = (
  word: string,
  number: number | undefined,
  plural = 's'
) => (number === 1 ? word : `${word}${plural}`)

export const isSelecting = (text: string[]) => {
  const selection = window.getSelection()

  return (
    text.includes(selection?.focusNode?.nodeValue || '') &&
    selection?.anchorOffset !== selection?.focusOffset
  )
}
