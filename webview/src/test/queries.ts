import { getByText, queryHelpers, screen, within } from '@testing-library/react'

export const getRow = (queryText: string): HTMLElement => {
  const testRow = screen
    .getAllByRole('row')
    .find(row => within(row).queryByText(queryText))
  if (!testRow) {
    throw new Error(`Couldn't find a row with the text "${queryText}"`)
  }
  return testRow
}

const getDraggableHeaderFromText = (container: HTMLElement, text: string) => {
  const identifiableHeader = getByText(container, text)
  if (!identifiableHeader) {
    throw queryHelpers.getElementError(
      `Unable to find an element with text "${text}"`,
      container
    )
  }
  const draggableHeader = identifiableHeader.parentElement?.parentElement
  if (!draggableHeader) {
    throw queryHelpers.getElementError(
      `Element with text "${text}" is not part of a draggable header`,
      container
    )
  }
  return draggableHeader
}

export const customQueries = { getDraggableHeaderFromText }
