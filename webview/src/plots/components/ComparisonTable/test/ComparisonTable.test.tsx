/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import React from 'react'
import { createBubbledEvent, dragAndDrop } from '../../../../test/dragDrop'
import { ComparisonTable, ComparisonTableProps } from '../ComparisonTable'
import { vsCodeApi } from '../../../../shared/api'

const getHeaders = () => screen.getAllByRole('columnheader')

jest.mock('../../../../shared/api')

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

describe('ComparisonTable', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  const basicProps: ComparisonTableProps = comparisonTableFixture
  const revisions = basicProps.revisions.map(({ revision }) => revision)
  const renderTable = (props = basicProps) =>
    render(<ComparisonTable {...props} />)

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

  it('should send a reorder message when a column is pinned', () => {
    renderTable()

    const thirdExperiment = revisions[2]
    const [originalFirstColumn] = getHeaders()

    fireEvent.click(screen.getByText(thirdExperiment), {
      bubbles: true,
      cancelable: true
    })

    const [currentFirstColumn, movedFirstColumn] = getHeaders()

    expect(originalFirstColumn).not.toStrictEqual(currentFirstColumn)
    expect(originalFirstColumn).toStrictEqual(movedFirstColumn)

    expect(mockPostMessage).toBeCalledTimes(1)
    expect(mockPostMessage).toBeCalledWith({
      payload: [
        thirdExperiment,
        ...revisions.filter(rev => rev !== thirdExperiment)
      ],
      type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
    })
  })

  it('should unpin a column with a second click', () => {
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
    expect(pinnedColumn.getAttribute('draggable')).toBe('false')
    expect(pinnedColumn.textContent).toBe(secondColumn.textContent)

    fireEvent.click(screen.getByText(secondExperiment), {
      bubbles: true,
      cancelable: true
    })

    const [unpinnedColumn] = getHeaders()
    expect(unpinnedColumn.getAttribute('draggable')).toBe('true')
    expect(unpinnedColumn.textContent).toBe(secondColumn.textContent)
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

    expect(headers).toStrictEqual(revisions)

    const filteredRevisions = basicProps.revisions.filter(
      ({ revision }) => revision !== revisions[3]
    )

    rerender(<ComparisonTable {...basicProps} revisions={filteredRevisions} />)

    headers = getHeaders().map(header => header.textContent)

    expect(headers).toStrictEqual([
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

    expect(headers).toStrictEqual([...revisions, newRevName])
  })

  describe('Columns drag and drop', () => {
    const pinSecondColumn = () => {
      const secondColumn = screen.getByText(revisions[1])

      fireEvent.click(secondColumn, {
        bubbles: true,
        cancelable: true
      })
    }

    it('should make the columns draggable if they are not pinned', () => {
      renderTable()

      const headers = getHeaders()

      for (const header of headers) {
        expect(header.getAttribute('draggable')).toBe('true')
      }

      pinSecondColumn()

      const [firstHeader] = getHeaders()

      expect(firstHeader.getAttribute('draggable')).toBe('false')
    })

    it('should reorder the columns accordingly and send a message to the extension after a column drag and drop', () => {
      renderTable()

      const [, endingNode, , startingNode] = getHeaders()

      let headers = getHeaders().map(header => header.textContent)

      expect(headers).toStrictEqual(revisions)

      dragAndDrop(startingNode, endingNode)

      headers = getHeaders().map(header => header.textContent)

      const expectedRevisions = [
        revisions[0],
        revisions[3],
        revisions[1],
        revisions[2],
        revisions[4]
      ]

      expect(headers).toStrictEqual(expectedRevisions)
      expect(mockPostMessage).toBeCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: expectedRevisions,
        type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
      })
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

      expect(headers).toStrictEqual(expectedOrder)

      dragAndDrop(startingNode, endingNode)

      expect(headers).toStrictEqual(expectedOrder)
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
  })
})
