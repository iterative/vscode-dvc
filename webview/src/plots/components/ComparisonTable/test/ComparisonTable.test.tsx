/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import React from 'react'
import { ComparisonTable, ComparisonTableProps } from '../ComparisonTable'

describe('ComparisonTable', () => {
  afterEach(() => {
    cleanup()
  })

  const basicProps: ComparisonTableProps = comparisonTableFixture
  const revisions = basicProps.revisions.map(({ revision }) => revision)
  const renderTable = (props = basicProps) =>
    render(<ComparisonTable {...props} />)

  const getHeaders = () => screen.getAllByRole('columnheader')

  it('should render a table', () => {
    renderTable()

    const table = screen.getByRole('table')

    expect(table).toBeInTheDocument()
  })

  it('should have as many columns as there are revisions', () => {
    renderTable()

    const columns = getHeaders()

    expect(columns.length).toBe(basicProps.revisions.length)
  })

  it('should show the pinned column first', () => {
    renderTable()

    const [firstColumn, secondColumn] = screen.getAllByRole('columnheader')
    const [firstExperiment, secondExperiment] = revisions

    const expectedFirstColumn = screen.getByText(firstExperiment)

    expect(firstColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(screen.getByText(secondExperiment), {
      bubbles: true,
      cancelable: true
    })

    const [pinnedColumn] = getHeaders()

    expect(pinnedColumn.textContent).toBe(secondColumn.textContent)
  })

  it('should have as many twice as many rows as there are plots entries', () => {
    renderTable()

    const rows = screen.getAllByRole('row')

    expect(rows.length).toBe(Object.entries(basicProps.plots).length * 2 + 1) // 1 header row and 2 rows per plot
  })

  it('should display the plots in the rows in the same order as the columns', () => {
    renderTable()

    const [{ path: firstPlotEntry }] = basicProps.plots
    const [firstExperiment, secondExperiment] = revisions

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

  it('should remove a column if it is not part of the revisions anymore', () => {
    const { rerender } = renderTable()

    let headers = getHeaders().map(header => header.textContent)

    expect(headers).toEqual(revisions)

    const filteredRevisions = basicProps.revisions.filter(
      ({ revision }) => revision !== revisions[3]
    )

    rerender(<ComparisonTable {...basicProps} revisions={filteredRevisions} />)

    headers = getHeaders().map(header => header.textContent)

    expect(headers).toEqual([
      revisions[0],
      revisions[1],
      revisions[2],
      revisions[4]
    ])
  })

  it('should add a new column if there is a new revision', () => {
    const { rerender } = renderTable()
    const newRevName = 'newRev'
    const newRevisions = [
      ...basicProps.revisions,
      { displayColor: '#000000', revision: newRevName }
    ]

    rerender(<ComparisonTable {...basicProps} revisions={newRevisions} />)
    const headers = getHeaders().map(header => header.textContent)

    expect(headers).toEqual([...revisions, newRevName])
  })

  describe('Columns drag and drop', () => {
    const testStorage = new Map()
    const createBubbledEvent = (type: string, props = {}) => {
      const event = new Event(type, {
        bubbles: true
      })
      Object.assign(event, props)
      Object.assign(event, {
        dataTransfer: {
          getData: (key: string) => testStorage.get(key),
          setData: (key: string, value: Object) => testStorage.set(key, value)
        }
      })
      return event
    }

    const pinSecondColumn = () => {
      const secondColumn = screen.getByText(revisions[1])

      fireEvent.click(secondColumn, {
        bubbles: true,
        cancelable: true
      })
    }

    const dragAndDrop = (
      startingNode: HTMLElement,
      endingNode: HTMLElement
    ) => {
      startingNode.dispatchEvent(createBubbledEvent('dragstart'))

      endingNode.dispatchEvent(createBubbledEvent('drop'))
    }

    it('should make the columns draggable if they are not pinned', () => {
      renderTable()

      const headers = getHeaders()

      headers.forEach(header => {
        expect(header.getAttribute('draggable')).toBe('true')
      })

      pinSecondColumn()

      const [firstHeader] = getHeaders()

      expect(firstHeader.getAttribute('draggable')).toBe('false')
    })

    it('should reorder the columns accordingly after a column drag and drop', () => {
      renderTable()

      const [, endingNode, , startingNode] = getHeaders()

      let headers = getHeaders().map(header => header.textContent)

      expect(headers).toEqual(revisions)

      dragAndDrop(startingNode, endingNode)

      headers = getHeaders().map(header => header.textContent)

      expect(headers).toEqual([
        revisions[0],
        revisions[3],
        revisions[1],
        revisions[2],
        revisions[4]
      ])
    })

    it('should not change the column order if a column is dropped on a pinned column', () => {
      renderTable()

      pinSecondColumn()

      const [, endingNode, , startingNode] = getHeaders()
      const expectedOrder = [
        revisions[1],
        revisions[0],
        revisions[2],
        revisions[3],
        revisions[4]
      ]

      const headers = getHeaders().map(header => header.textContent)

      expect(headers).toEqual(expectedOrder)

      dragAndDrop(startingNode, endingNode)

      expect(headers).toEqual(expectedOrder)
    })

    it('should prevent default behaviour when dragging over', () => {
      renderTable()

      const [firstNode] = getHeaders()

      const dragOverEvent = createBubbledEvent('dragover', {
        preventDefault: jest.fn()
      })

      firstNode.dispatchEvent(dragOverEvent)

      expect(dragOverEvent.preventDefault).toHaveBeenCalled()
    })

    it('should not reorder existing columns when adding a new one after a drag and drop', () => {
      const { rerender } = renderTable()

      const [, endingNode, , startingNode] = getHeaders()

      dragAndDrop(startingNode, endingNode)

      let headers = getHeaders().map(header => header.textContent)

      const reorderedRevisions = [
        revisions[0],
        revisions[3],
        revisions[1],
        revisions[2],
        revisions[4]
      ]

      expect(headers).toEqual(reorderedRevisions)

      const newRevName = 'newRev'
      const originalRevisionsWithNew = [
        ...basicProps.revisions,
        { displayColor: '#000000', revision: newRevName }
      ]

      rerender(
        <ComparisonTable {...basicProps} revisions={originalRevisionsWithNew} />
      )

      headers = getHeaders().map(header => header.textContent)
      expect(headers).toEqual([...reorderedRevisions, newRevName])
    })
  })
})
