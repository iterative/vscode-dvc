/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import complexExperimentsOutput from 'dvc/src/webviews/experiments/complex-output-example.json'
import { ExperimentsTable } from './index'

afterEach(() => {
  cleanup()
})

const ExperimentsTableComponent = (
  <ExperimentsTable experiments={complexExperimentsOutput} />
)

describe('Experiments', () => {
  describe('Given the experiments data to add to the experiments table', () => {
    describe('When we render the Experiments Table', () => {
      it('Then the experiments table should be rendered with table header options', async () => {
        const { getByTestId } = render(ExperimentsTableComponent)
        expect(getByTestId('table-header-options')).toBeTruthy()
        expect(getByTestId('sort-indicator')).toBeTruthy()
        expect(getByTestId('manage-columns')).toBeTruthy()
        expect(getByTestId('experiments-table')).toBeTruthy()
      })
    })
  })

  describe('Given the unsorted experiments table', () => {
    describe('When we render the Experiments Table', () => {
      it('Then the SortIndicator should be rendered with unsorted state', async () => {
        const { getByTestId } = render(ExperimentsTableComponent)
        expect(getByTestId('sort-indicator')).toHaveTextContent('None')
      })
    })
  })
})
