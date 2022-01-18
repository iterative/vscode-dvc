/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { getImageData } from 'dvc/src/test/fixtures/plotsDiff'
import React from 'react'
import { ComparisonTable, ComparisonTableProps } from '../ComparisonTable'

describe('ComparisonTable', () => {
  afterEach(() => {
    cleanup()
  })

  const basicProps: ComparisonTableProps = {
    colors: {
      '6220556': '#f14c4c',
      a9eb4fd: '#3794ff'
    },
    plots: getImageData('.')
  }
  const renderTable = (props = basicProps) =>
    render(<ComparisonTable {...props} />)

  it('should render a table', () => {
    renderTable()

    const table = screen.getByRole('table')

    expect(table).toBeInTheDocument()
  })

  it('should have as many columns as there are items in the domain of colors', () => {
    renderTable()

    const columns = screen.getAllByRole('columnheader')

    expect(columns.length).toBe(Object.keys(basicProps.colors).length)
  })

  it('should show the pinned column first', () => {
    renderTable()

    const [firstColumn, secondColumn] = screen.getAllByRole('columnheader')
    const [firstExperiment, secondExperiment] = Object.keys(basicProps.colors)

    const expectedFirstColumn = screen.getByText(firstExperiment)

    expect(firstColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(screen.getByText(secondExperiment), {
      bubbles: true,
      cancelable: true
    })

    const [pinnedColumn] = screen.getAllByRole('columnheader')

    expect(pinnedColumn.textContent).toBe(secondColumn.textContent)
  })

  it('should have as many twice as many rows as there are plots entries', () => {
    renderTable()

    const rows = screen.getAllByRole('row')

    expect(rows.length).toBe(Object.entries(basicProps.plots).length * 2 + 1) // 1 header row and 2 rows per plot
  })

  it('should display the plots in the rows in the same order as the columns', () => {
    renderTable()

    const firstPlotEntry = Object.entries(basicProps.plots)[0][0]
    const [firstExperiment, secondExperiment] = Object.keys(basicProps.colors)
    const [firstPlot, secondPlot] = screen.getAllByRole('img')
    const expectedFirstPlot = screen.getByAltText(
      `Plot of ${firstPlotEntry} (${firstExperiment})`
    )
    const expectedSecondPlot = screen.getByAltText(
      `Plot of ${firstPlotEntry} (${secondExperiment})`
    )

    expect(firstPlot.isSameNode(expectedFirstPlot)).toBe(true)
    expect(secondPlot.isSameNode(expectedSecondPlot)).toBe(true)

    fireEvent.click(screen.getByText(secondExperiment), {
      bubbles: true,
      cancelable: true
    })

    const [changedFirstPlot, changedSecondPlot] = screen.getAllByRole('img')

    expect(changedSecondPlot.isSameNode(expectedFirstPlot)).toBe(true)
    expect(changedFirstPlot.isSameNode(expectedSecondPlot)).toBe(true)
  })
})
