/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { getImageData } from 'dvc/src/test/fixtures/plotsShow'
import { ComparisonTable, ComparisonTableProps } from '../ComparisonTable'

describe('ComparisonTable', () => {
  afterEach(() => {
    cleanup()
  })

  const basicProps: ComparisonTableProps = {
    colors: {
      domain: ['workspace', 'HEAD'],
      range: ['#f14c4c', '#3794ff']
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

    expect(columns.length).toBe(basicProps.colors.domain.length)
  })

  it('should show the pinned column first', () => {
    renderTable()

    const [firstColumn, secondColumn] = screen.getAllByRole('columnheader')
    const expectedFirstColumn = screen.getByText(basicProps.colors.domain[0])

    expect(firstColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(screen.getByText(basicProps.colors.domain[1]), {
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
    const [firstPlot, secondPlot] = screen.getAllByRole('img')
    const expectedFirstPlot = screen.getByAltText(
      `Plot of ${firstPlotEntry} (${basicProps.colors.domain[0]})`
    )
    const expectedSecondPlot = screen.getByAltText(
      `Plot of ${firstPlotEntry} (${basicProps.colors.domain[1]})`
    )

    expect(firstPlot.isSameNode(expectedFirstPlot)).toBe(true)
    expect(secondPlot.isSameNode(expectedSecondPlot)).toBe(true)

    fireEvent.click(screen.getByText(basicProps.colors.domain[1]), {
      bubbles: true,
      cancelable: true
    })

    const [changedFirstPlot, changedSecondPlot] = screen.getAllByRole('img')

    expect(changedSecondPlot.isSameNode(expectedFirstPlot)).toBe(true)
    expect(changedFirstPlot.isSameNode(expectedSecondPlot)).toBe(true)
  })
})
