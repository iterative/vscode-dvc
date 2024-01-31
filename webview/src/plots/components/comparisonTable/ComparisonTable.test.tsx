import { configureStore } from '@reduxjs/toolkit'
import '@testing-library/jest-dom'
import {
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
import { act } from 'react-dom/test-utils'
import { ComparisonTable } from './ComparisonTable'
import {
  comparisonTableInitialState,
  toggleDragAndDropMode
} from './comparisonTableSlice'
import {
  createBubbledEvent,
  dragAndDrop,
  dragEnter
} from '../../../test/dragDrop'
import { vsCodeApi } from '../../../shared/api'
import { DragEnterDirection } from '../../../shared/components/dragDrop/util'
import { plotsReducers, plotsStore } from '../../store'
import { webviewInitialState } from '../webviewSlice'
import { getThemeValue, hexToRGB, ThemeProperty } from '../../../util/styles'
import * as EventCurrentTargetDistances from '../../../shared/components/dragDrop/currentTarget'

const getHeaders = (): HTMLElement[] => screen.getAllByRole('columnheader')

jest.mock('../../../shared/api')
jest.mock('../../../shared/components/dragDrop/currentTarget', () => {
  const actualModule = jest.requireActual(
    '../../../shared/components/dragDrop/currentTarget'
  )
  return {
    __esModule: true,
    ...actualModule
  }
})

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const getPin = (element: HTMLElement) =>
  // eslint-disable-next-line testing-library/no-node-access
  within(element?.parentElement || element).getByRole('button')

describe('ComparisonTable', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const selectedRevisions: Revision[] = plotsRevisionsFixture
  const revisions = selectedRevisions.map(({ label }) => label)
  const ids = selectedRevisions.map(({ id }) => id)
  const namedRevisions = selectedRevisions.map(
    ({ label, description }) => `${label}${description || ''}`
  )

  const renderTable = (
    props = comparisonTableFixture,
    renderWith: (ui: React.ReactElement) => RenderResult | void = render
  ) => {
    const store = configureStore({
      preloadedState: {
        comparison: {
          ...comparisonTableInitialState,
          ...props
        },
        webview: {
          ...webviewInitialState,
          zoomedInPlot: undefined
        }
      },
      reducer: plotsReducers
    })
    const { rerender } =
      renderWith(
        <Provider store={store}>
          <ComparisonTable />
        </Provider>
      ) || {}

    return { rerender, store }
  }

  const getIntoDragAndDropMode = (store: typeof plotsStore) => {
    act(() => {
      store.dispatch(toggleDragAndDropMode(true))
    })
  }

  const renderTableInDragAndDropMode = () => {
    const { store } = renderTable()
    getIntoDragAndDropMode(store)
    return store
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

    const [, secondColumn, thirdColumn] = screen.getAllByRole('columnheader')
    const [, secondExperiment, thirdExperiment] = revisions

    const expectedFirstColumn = screen.getByText(secondExperiment)

    expect(secondColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(getPin(screen.getByText(thirdExperiment)), {
      bubbles: true,
      cancelable: true
    })

    const [pinnedColumn] = getHeaders()

    expect(pinnedColumn.textContent).toBe(thirdColumn.textContent)
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

    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: [ids[2], ...ids.filter(rev => rev !== ids[2])],
      type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
    })
  })

  it('should unpin a column with a second click', () => {
    renderTableInDragAndDropMode()

    const [, secondColumn, thirdColumn] = screen.getAllByRole('columnheader')
    const [, secondExperiment, thirdExperiment] = revisions

    const expectedFirstColumn = screen.getByText(secondExperiment)

    expect(secondColumn.textContent).toBe(expectedFirstColumn.textContent)

    fireEvent.click(getPin(screen.getByText(thirdExperiment)), {
      bubbles: true,
      cancelable: true
    })

    const [pinnedColumn] = getHeaders()
    expect(pinnedColumn.getAttribute('draggable')).toBe('false')
    expect(pinnedColumn.textContent).toBe(thirdColumn.textContent)

    fireEvent.click(getPin(screen.getByText(thirdExperiment)), {
      bubbles: true,
      cancelable: true
    })

    const [unpinnedColumn] = getHeaders()
    expect(unpinnedColumn.getAttribute('draggable')).toBe('true')
    expect(unpinnedColumn.textContent).toBe(thirdColumn.textContent)
  })

  it('should have as many twice as many rows as there are plots entries', () => {
    renderTable()

    const rows = screen.getAllByRole('row')

    expect(rows.length).toBe(
      Object.entries(comparisonTableFixture.plots).length * 2 + 2
    ) // 1 header row, 1 bounding box classes row, and 2 rows per plot
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
    const { rerender } = renderTable() as unknown as RenderResult

    let headers = getHeaders().map(header => header.textContent)

    expect(headers).toStrictEqual(namedRevisions)

    const filteredRevisions = selectedRevisions.filter(
      ({ label }) => label !== revisions[3]
    )

    renderTable(
      {
        ...comparisonTableFixture,
        revisions: filteredRevisions
      },
      rerender
    )

    headers = getHeaders().map(header => header.textContent)

    const expectedRevisions = filteredRevisions.map(
      ({ label, description }) => `${label}${description || ''}`
    )

    expect(headers).toStrictEqual(expectedRevisions)
  })

  it('should add a new column if there is a new revision', () => {
    const { rerender } = renderTable() as unknown as RenderResult

    const newRevName = 'newRev'
    const newRevisions = [
      ...selectedRevisions,
      {
        displayColor: '#000000',
        fetched: true,
        id: newRevName,
        label: newRevName
      }
    ] as Revision[]

    renderTable(
      {
        ...comparisonTableFixture,
        plots: comparisonTableFixture.plots.map(plot => ({
          ...plot,
          revisions: {
            ...plot.revisions,
            [newRevName]: {
              id: newRevName,
              imgs: [{ errors: undefined, loading: false, url: undefined }]
            }
          }
        })),
        revisions: newRevisions
      },
      rerender
    )
    const headers = getHeaders().map(header => header.textContent)

    expect(headers).toStrictEqual([...namedRevisions, newRevName])
  })

  it('should not display a refresh button for a revision that does not contain an image', () => {
    const revisionWithNoData = 'missing-data'

    renderTable({
      ...comparisonTableFixture,
      plots: comparisonTableFixture.plots.map(({ revisions, ...rest }) => ({
        ...rest,
        revisions: {
          ...revisions,
          [revisionWithNoData]: {
            id: revisionWithNoData,
            imgs: [
              {
                errors: undefined,
                loading: false,
                url: undefined
              }
            ]
          }
        }
      })),
      revisions: [
        ...comparisonTableFixture.revisions,
        {
          description: undefined,
          displayColor: '#f56565',
          fetched: true,
          id: revisionWithNoData,
          label: 'noData',
          summaryColumns: []
        }
      ]
    })

    expect(screen.queryByText('Refresh')).not.toBeInTheDocument()
  })

  it('should display a refresh button for each revision that has an image with an error', () => {
    const revisionWithNoData = 'missing-data'

    renderTable({
      ...comparisonTableFixture,
      plots: comparisonTableFixture.plots.map(({ revisions, ...rest }) => ({
        ...rest,
        revisions: {
          ...revisions,
          [revisionWithNoData]: {
            id: revisionWithNoData,
            imgs: [
              {
                errors: ['this is an error'],
                loading: false,
                url: undefined
              }
            ]
          }
        }
      })),
      revisions: [
        ...comparisonTableFixture.revisions,
        {
          description: undefined,
          displayColor: '#f56565',
          fetched: true,
          id: revisionWithNoData,
          label: 'noData',
          summaryColumns: []
        }
      ]
    })

    const refreshButtons = screen.getAllByText('Refresh')

    expect(refreshButtons).toHaveLength(comparisonTableFixture.plots.length)

    for (const button of refreshButtons) {
      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.REFRESH_REVISIONS
      })
      mockPostMessage.mockReset()
    }
  })

  it('should calculate the headers top property on scroll', () => {
    renderTable()

    const aHeader = screen.getAllByRole('columnheader')[0]
    expect(aHeader.style.top).toBe('')

    fireEvent.scroll(window)

    expect(aHeader.style.top).not.toBe('')
  })

  it('should not throw an error when an image is removed from the data', () => {
    const { rerender } = renderTable()

    const plotsWithMissingImage = comparisonTableFixture.plots.slice(1)
    expect(plotsWithMissingImage.length).toStrictEqual(
      comparisonTableFixture.plots.length - 1
    )

    expect(() =>
      renderTable(
        {
          ...comparisonTableFixture,
          plots: plotsWithMissingImage
        },
        rerender
      )
    ).not.toThrow()
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
      renderTableInDragAndDropMode()

      const headers = getHeaders()

      for (const header of headers) {
        expect(header.getAttribute('draggable')).toBe('true')
      }

      pinSecondColumn()

      const [firstHeader] = getHeaders()

      expect(firstHeader.getAttribute('draggable')).toBe('false')
    })

    it('should reorder the columns accordingly and send a message to the extension after a column drag and drop', () => {
      renderTableInDragAndDropMode()

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

      const expectedIds = [ids[0], ids[3], ids[1], ids[2], ids[4]]

      expect(headers).toStrictEqual(expectedNamedRevisions)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: expectedIds,
        type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
      })
    })

    it('should not change the column order if a column is dropped on a pinned column', () => {
      renderTableInDragAndDropMode()

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
      renderTableInDragAndDropMode()

      pinSecondColumn()
      const [endingNode, startingNode] = getHeaders()

      dragEnter(startingNode, endingNode.id, DragEnterDirection.LEFT)

      const headers = getHeaders()

      expect(headers[0].id.includes('__drop')).toBe(false)
    })

    it('should prevent default behaviour when dragging over', () => {
      renderTableInDragAndDropMode()

      const [firstNode] = getHeaders()

      const dragOverEvent = createBubbledEvent('dragover', {
        preventDefault: jest.fn()
      })

      firstNode.dispatchEvent(dragOverEvent)

      expect(dragOverEvent.preventDefault).toHaveBeenCalled()
    })

    it('should show the header being dragged in its original position until the drop', () => {
      renderTableInDragAndDropMode()

      const [endingNode, startingNode] = getHeaders()

      dragEnter(startingNode, endingNode.id, DragEnterDirection.LEFT)

      const [, draggedHeader] = getHeaders()

      expect(draggedHeader.isEqualNode(startingNode)).toBe(true)
    })

    it('should wrap the drop target with the header we are dragging over', () => {
      renderTableInDragAndDropMode()

      const [endingNode, startingNode] = getHeaders()

      dragEnter(startingNode, endingNode.id, DragEnterDirection.LEFT)

      const [headerWrapper] = getHeaders()

      expect(
        within(headerWrapper).getByTestId('comparison-drop-target')
      ).toBeInTheDocument()
    })

    it('should not change the order when dropping a header in its own spot', () => {
      const store = renderTableInDragAndDropMode()

      const [startingNode] = getHeaders()

      dragAndDrop(startingNode, startingNode, DragEnterDirection.RIGHT)
      expect(mockPostMessage).not.toHaveBeenCalled()

      getIntoDragAndDropMode(store)
      const [start, end] = getHeaders()

      dragAndDrop(start, end, DragEnterDirection.RIGHT)
      expect(mockPostMessage).toHaveBeenCalled()
    })

    it('should add and remove the style for the ghost header being dragged', () => {
      jest.useFakeTimers()

      document.documentElement.style.setProperty(
        ThemeProperty.ACCENT_COLOR,
        '#ffffff'
      )
      document.documentElement.style.setProperty(
        ThemeProperty.BACKGROUND_COLOR,
        '#ffffff'
      )

      renderTableInDragAndDropMode()

      const [header] = getHeaders()

      act(() => {
        header.dispatchEvent(createBubbledEvent('dragstart'))
      })

      expect(header.style.backgroundColor).toBe(
        hexToRGB(getThemeValue(ThemeProperty.ACCENT_COLOR))
      )
      expect(header.style.color).toBe(
        hexToRGB(getThemeValue(ThemeProperty.BACKGROUND_COLOR))
      )

      act(() => {
        jest.advanceTimersByTime(1)
      })

      expect(header.style.backgroundColor).toBe('')
      expect(header.style.color).toBe('')

      jest.useRealTimers()
    })

    it('should not be possible to drag a plot when the drag and drop mode is set to false', () => {
      renderTable()

      const [, endingNode, , startingNode] = getHeaders()

      let headers = getHeaders().map(header => header.textContent)

      expect(headers).toStrictEqual(namedRevisions)

      dragAndDrop(startingNode, endingNode)

      headers = getHeaders().map(header => header.textContent)

      expect(headers).toStrictEqual(namedRevisions)
    })

    it('should toggle from normal to drag and drop mode when the user presses down on a header', () => {
      const { store } = renderTable()

      expect(store.getState().comparison.isInDragAndDropMode).toBe(false)

      const [header] = screen.getAllByRole('columnheader')
      fireEvent.mouseDown(header)

      expect(store.getState().comparison.isInDragAndDropMode).toBe(true)
    })

    it('should toggle from drag and drop to normal mode when dropping a header', () => {
      const { store } = renderTable()

      const [header] = screen.getAllByRole('columnheader')
      fireEvent.mouseDown(header)

      expect(store.getState().comparison.isInDragAndDropMode).toBe(true)

      const [, endingNode, , startingNode] = getHeaders()
      dragAndDrop(startingNode, endingNode)

      expect(store.getState().comparison.isInDragAndDropMode).toBe(false)
    })
  })

  describe('Rows drag and drop', () => {
    it('should move a row before the previous one when dropped from the top', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup') // First rowgroup is the thead

      dragAndDrop(secondRow, firstRow, DragEnterDirection.TOP)

      const [, newFirstRow, newSecondRow] = screen.getAllByRole('rowgroup')

      expect(newFirstRow.id).toStrictEqual(secondRow.id)
      expect(newSecondRow.id).toStrictEqual(firstRow.id)
    })

    it('should not move a row before the previous one when dropped from the bottom', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup') // First rowgroup is the thead

      dragAndDrop(
        secondRow,
        firstRow,
        DragEnterDirection.BOTTOM,
        EventCurrentTargetDistances
      )

      const [, newFirstRow, newSecondRow] = screen.getAllByRole('rowgroup')

      expect(newFirstRow.id).toStrictEqual(firstRow.id)
      expect(newSecondRow.id).toStrictEqual(secondRow.id)
    })

    it('should move a row after the next one when dropped from the bottom', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup') // First rowgroup is the thead

      dragAndDrop(
        firstRow,
        secondRow,
        DragEnterDirection.BOTTOM,
        EventCurrentTargetDistances
      )

      const [, newFirstRow, newSecondRow] = screen.getAllByRole('rowgroup')

      expect(newFirstRow.id).toStrictEqual(secondRow.id)
      expect(newSecondRow.id).toStrictEqual(firstRow.id)
    })

    it('should not move a row after the next one when dropped from the top', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup') // First rowgroup is the thead

      dragAndDrop(firstRow, secondRow, DragEnterDirection.TOP)

      const [, newFirstRow, newSecondRow] = screen.getAllByRole('rowgroup')

      expect(newFirstRow.id).toStrictEqual(firstRow.id)
      expect(newSecondRow.id).toStrictEqual(secondRow.id)
    })

    it('should show a drop target after a row when dragging from the bottom', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup') // First rowgroup is the thead

      dragEnter(
        firstRow,
        secondRow.id,
        DragEnterDirection.BOTTOM,
        EventCurrentTargetDistances
      )

      const dropTarget = screen.getAllByRole('rowgroup')[2]

      expect(dropTarget.id).toStrictEqual(`${secondRow.id}__drop`)
    })

    it('should show a drop target before a row when dragging from the top', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup') // First rowgroup is the thead

      dragEnter(secondRow, firstRow.id, DragEnterDirection.TOP)

      const [, dropTarget] = screen.getAllByRole('rowgroup')

      expect(dropTarget.id).toStrictEqual(`${firstRow.id}__drop`)
    })

    it('should send a message with the changed rows order', () => {
      renderTable()

      const [, firstRow, secondRow] = screen.getAllByRole('rowgroup')

      dragAndDrop(firstRow, secondRow, DragEnterDirection.BOTTOM)

      const reorderedRows = screen.getAllByRole('rowgroup').slice(1)
      const newOrder = reorderedRows.map(row => row.id)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: newOrder,
        type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS
      })
    })
  })

  describe('Plots With Bounding Boxes', () => {
    it('should show toggable labels in the plot row', () => {
      renderTable()

      const boundingBoxPlotClasses = screen.getByTestId(
        'row-bounding-box-classes'
      )

      expect(
        within(boundingBoxPlotClasses).getByText('Classes')
      ).toBeInTheDocument()

      const checkedLabel = within(boundingBoxPlotClasses).getByLabelText(
        'traffic light'
      )
      expect(checkedLabel).toBeInTheDocument()
      expect(checkedLabel).toHaveAttribute('checked')
    })

    it('should show svgs with bounding boxes instead of images', () => {
      renderTable()

      const boundingBoxPlotImage = screen.getByLabelText(
        /bounding_boxes.png \(workspace\)/
      )
      expect(boundingBoxPlotImage).toHaveAttribute('viewBox')
      expect(
        within(boundingBoxPlotImage).getByText('traffic light')
      ).toBeInTheDocument()
      expect(within(boundingBoxPlotImage).getAllByText('car')).toHaveLength(2)
    })
  })
})
