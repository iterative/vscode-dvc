import { screen, within } from '@testing-library/react'

export const getRow = (queryText: string): HTMLElement => {
  const testRow = screen
    .getAllByRole('row')
    .find(row => within(row).queryByText(queryText))
  if (!testRow) {
    throw new Error(`Couldn't find a row with the text "${queryText}"`)
  }
  return testRow
}
