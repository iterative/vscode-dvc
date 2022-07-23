/**
 * @jest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit'
import '@testing-library/jest-dom/extend-expect'
import {
  cleanup,
  fireEvent,
  render,
  RenderResult,
  screen,
  within
} from '@testing-library/react'
import { Provider } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import React from 'react'
import { Revision } from 'dvc/src/plots/webview/contract'
import { ComparisonTable } from './ComparisonTable'
import { comparisonTableInitialState } from './comparisonTableSlice'
import {
  createBubbledEvent,
  dragAndDrop,
  dragEnter
} from '../../../test/dragDrop'
import { vsCodeApi } from '../../../shared/api'
import { DragEnterDirection } from '../../../shared/components/dragDrop/util'
import { storeReducers } from '../../store'
import { webviewInitialState } from '../webviewSlice'

const getHeaders = () => screen.getAllByRole('columnheader')

jest.mock('../../../shared/api')

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const getPin = (element: HTMLElement) => within(element).getByRole('button')

describe('ComparisonTable', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  const selectedRevisions: Revision[] = plotsRevisionsFixture
  const revisions = selectedRevisions.map(({ revision }) => revision)
  const namedRevisions = selectedRevisions.map(
    ({ revision, group }) => `${revision}${group || ''}`
  )

  const renderTable = (
    props = comparisonTableFixture,
    revisions: Revision[] = plotsRevisionsFixture,
    renderWith: (ui: React.ReactElement) => RenderResult | void = render
  ) => {
    return (
      renderWith(
        <Provider
          store={configureStore({
            preloadedState: {
              comparison: {
                ...comparisonTableInitialState,
                ...props
              },
              webview: {
                ...webviewInitialState,
                selectedRevisions: revisions,
                zoomedInPlot: undefined
              }
            },
            reducer: storeReducers
          })}
        >
          <ComparisonTable />
        </Provider>
      ) || {}
    )
  }

  it('should render a table', () => {
    renderTable()

    const table = screen.getByRole('table')

    expect(table).toBeInTheDocument()
  })

  it('should have as many columns as there are revisions', () => {
    renderTable()

    const columns = getHeaders()

    expect(columns.length).toBe(revisions.length)
  })

  it('should show the pinned column first', () => {
    renderTable()

    const [firstColumn, secondColumn] = screen.getAllByRole('columnheader')
    const [firstExperiment, secondExperiment] = revisions

    const expectedFirstColumn = screen.getByText(firstExperiment)

    expect(firstColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(getPin(screen.getByText(secondExperiment)), {
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

    fireEvent.click(getPin(screen.getByText(thirdExperiment)), {
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
      type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
    })
  })

  it('should unpin a column with a second click', () => {
    renderTable()

    const [firstColumn, secondColumn] = screen.getAllByRole('columnheader')
    const [firstExperiment, secondExperiment] = revisions

    const expectedFirstColumn = screen.getByText(firstExperiment)

    expect(firstColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(getPin(screen.getByText(secondExperiment)), {
      bubbles: true,
      cancelable: true
    })

    const [pinnedColumn] = getHeaders()
    expect(pinnedColumn.getAttribute('draggable')).toBe('false')
    expect(pinnedColumn.textContent).toBe(secondColumn.textContent)

    fireEvent.click(getPin(screen.getByText(secondExperiment)), {
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

    expect(rows.length).toBe(
      Object.entries(comparisonTableFixture.plots).length * 2 + 1
    ) // 1 header row and 2 rows per plot
  })

  it('should display the plots in the rows in the same order as the columns', () => {
    renderTable()

    const [{ path: firstPlotEntry }] = comparisonTableFixture.plots
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

    fireEvent.click(getPin(screen.getByText(secondExperiment)), {
      bubbles: true,
      cancelable: true
    })

    const [changedFirstPlot, changedSecondPlot] = screen.getAllByRole('img')

    expect(changedSecondPlot.isSameNode(expectedFirstPlot)).toBe(true)
    expect(changedFirstPlot.isSameNode(expectedSecondPlot)).toBe(true)
  })

  it('should remove a column if it is not part of the revisions anymore', () => {
    const { rerender } = renderTable() as RenderResult

    let headers = getHeaders().map(header => header.textContent)

    expect(headers).toStrictEqual(namedRevisions)

    const filteredRevisions = selectedRevisions.filter(
      ({ revision }) => revision !== revisions[3]
    )

    renderTable(comparisonTableFixture, filteredRevisions, rerender)

    headers = getHeaders().map(header => header.textContent)

    const expectedRevisions = filteredRevisions.map(
      ({ revision, group }) => `${revision}${group || ''}`
    )

    expect(headers).toStrictEqual(expectedRevisions)
  })

  it('should add a new column if there is a new revision', () => {
    const { rerender } = renderTable() as RenderResult

    const newRevName = 'newRev'
    const newRevisions = [
      ...selectedRevisions,
      { displayColor: '#000000', revision: newRevName }
    ] as Revision[]

    renderTable(comparisonTableFixture, newRevisions, rerender)
    const headers = getHeaders().map(header => header.textContent)

    expect(headers).toStrictEqual([...namedRevisions, newRevName])
  })

  it('should display a refresh button for each revision that has a missing image', () => {
    const revisionWithNoData = 'missing-data'

    renderTable(
      {
        ...comparisonTableFixture,
        plots: comparisonTableFixture.plots.map(({ path, revisions }) => ({
          path,
          revisions: {
            ...revisions,
            [revisionWithNoData]: {
              revision: revisionWithNoData,
              url: undefined
            }
          }
        }))
      },
      [
        ...selectedRevisions,
        {
          displayColor: '#f56565',
          group: undefined,
          id: 'noData',
          revision: revisionWithNoData
        }
      ]
    )

    const refreshButtons = screen.getAllByText('Refresh')

    expect(refreshButtons).toHaveLength(comparisonTableFixture.plots.length)

    for (const button of refreshButtons) {
      fireEvent.click(button)
      expect(mockPostMessage).toBeCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: revisionWithNoData,
        type: MessageFromWebviewType.REFRESH_REVISION
      })
      mockPostMessage.mockReset()
    }
  })

  describe('Columns drag and drop', () => {
    const pinSecondColumn = () => {
      const secondColumn = getPin(screen.getByText(revisions[1]))

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

      expect(headers).toStrictEqual(namedRevisions)

      dragAndDrop(startingNode, endingNode)

      headers = getHeaders().map(header => header.textContent)

      const expectedNamedRevisions = [
        namedRevisions[0],
        namedRevisions[3],
        namedRevisions[1],
        namedRevisions[2],
        namedRevisions[4]
      ]

      const expectedRevisions = [
        revisions[0],
        revisions[3],
        revisions[1],
        revisions[2],
        revisions[4]
      ]

      expect(headers).toStrictEqual(expectedNamedRevisions)
      expect(mockPostMessage).toBeCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: expectedRevisions,
        type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
      })
    })

    it('should not change the column order if a column is dropped on a pinned column', () => {
      renderTable()

      pinSecondColumn()

      const [, endingNode, , startingNode] = getHeaders()
      const expectedOrder = [
        namedRevisions[1],
        namedRevisions[0],
        namedRevisions[2],
        namedRevisions[3],
        namedRevisions[4]
      ]

      const headers = getHeaders().map(header => header.textContent)

      expect(headers).toStrictEqual(expectedOrder)

      dragAndDrop(startingNode, endingNode)

      expect(headers).toStrictEqual(expectedOrder)
    })

    it('should not show a drop placeholder to replace a pinned column', () => {
      renderTable()

      pinSecondColumn()
      const [endingNode, startingNode] = getHeaders()

      dragEnter(startingNode, endingNode.id, DragEnterDirection.LEFT)

      const headers = getHeaders()

      expect(headers[0].id.includes('__drop')).toBe(false)
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

    it('should show the header being dragged in its original position until the drop', () => {
      renderTable()

      const [endingNode, startingNode] = getHeaders()

      dragEnter(startingNode, endingNode.id, DragEnterDirection.LEFT)

      const [, draggedHeader] = getHeaders()

      expect(draggedHeader.isSameNode(startingNode)).toBe(true)
    })

    it('should wrap the drop target with the header we are dragging over', () => {
      renderTable()

      const [endingNode, startingNode] = getHeaders()

      dragEnter(startingNode, endingNode.id, DragEnterDirection.LEFT)

      const [headerWrapper] = getHeaders()

      expect(headerWrapper.childElementCount).toBe(2)
      expect(headerWrapper.contains(endingNode)).toBe(true)
    })

    it('should not change the order when dropping a header in its own spot', () => {
      renderTable()

      const [startingAndEndingNode, secondEndingNode] = getHeaders()

      dragAndDrop(
        startingAndEndingNode,
        startingAndEndingNode,
        DragEnterDirection.RIGHT
      )
      expect(mockPostMessage).not.toHaveBeenCalled()

      dragAndDrop(
        startingAndEndingNode,
        secondEndingNode,
        DragEnterDirection.RIGHT
      )
      expect(mockPostMessage).toHaveBeenCalled()
    })
  })
})
