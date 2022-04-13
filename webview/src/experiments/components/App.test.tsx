/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import React from 'react'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/tableData'
import deeplyNestedTableDataFixture from 'dvc/src/test/fixtures/expShow/deeplyNested'
import {
  ContextMenuPayload,
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import {
  mockDndElSpacing,
  mockGetComputedSpacing,
  makeDnd,
  DND_DIRECTION_RIGHT
} from 'react-beautiful-dnd-test-utils'
import { RowData, TableData } from 'dvc/src/experiments/webview/contract'
import { joinMetricOrParamPath } from 'dvc/src/experiments/metricsAndParams/paths'
import { App } from './App'
import { useIsFullyContained } from './overflowHoverTooltip/useIsFullyContained'
import styles from './table/styles.module.scss'
import { vsCodeApi } from '../../shared/api'
import {
  commonColumnFields,
  expectHeaders,
  makeGetDragEl,
  tableData as sortingTableDataFixture
} from '../../test/sort'
import {
  CELL_TOOLTIP_DELAY,
  HEADER_TOOLTIP_DELAY
} from '../../shared/components/tooltip/Tooltip'
import { getRow } from '../../test/queries'

jest.mock('../../shared/api')
jest.mock('../../util/styles')
jest.mock('./overflowHoverTooltip/useIsFullyContained', () => ({
  useIsFullyContained: jest.fn()
}))
const mockedUseIsFullyContained = jest.mocked(useIsFullyContained)

const { postMessage, setState } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)
const mockSetState = jest.mocked(setState)

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  describe('Sorting Classes', () => {
    const renderTableWithPlaceholder = () => {
      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: deeplyNestedTableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
    }

    it('should apply the sortingHeaderCellAsc class to only a top level placeholder', () => {
      renderTableWithPlaceholder()

      const topPlaceholder = screen.getByTestId(
        'header-params:params.yaml:outlier_previous_placeholder_18'
      )
      const midPlaceholder = screen.getByTestId(
        'header-params:params.yaml:outlier_previous_placeholder_12'
      )
      const headerCell = screen.getByTestId('header-params:params.yaml:outlier')

      expect(
        topPlaceholder.classList.contains(styles.sortingHeaderCellAsc)
      ).toBeTruthy()
      expect(
        midPlaceholder.classList.contains(styles.sortingHeaderCellAsc)
      ).toBeFalsy()
      expect(
        headerCell.classList.contains(styles.sortingHeaderCellAsc)
      ).toBeFalsy()
    })

    it('should apply the sortingHeaderCellAsc class to a header cell with no placeholders', () => {
      renderTableWithPlaceholder()

      const headerCell = screen.getByTestId(
        'header-params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.nested6'
      )

      expect(
        headerCell.classList.contains(styles.sortingHeaderCellAsc)
      ).toBeTruthy()
    })

    it('should apply the sortingHeaderCellDesc class to a header cell of a column sorted descending', () => {
      renderTableWithPlaceholder()

      const headerCell = screen.getByTestId(
        'header-params:params.yaml:nested1.doubled'
      )

      expect(
        headerCell.classList.contains(styles.sortingHeaderCellDesc)
      ).toBeTruthy()
    })
  })

  it('should send a message to the extension on the first render', () => {
    render(<App />)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZED
    })

    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should display the loading state before the experiments are shown', async () => {
    render(<App />)

    const loadingState = await screen.findByText('Loading Experiments...')
    expect(loadingState).toBeInTheDocument()
  })

  it('should show the no columns selected empty state when there are no columns provided', () => {
    render(<App />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: { ...tableDataFixture, columns: [] },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    const noColumnsState = screen.queryByText('No Columns Selected')
    expect(noColumnsState).toBeInTheDocument()
  })

  it('should show the no experiments empty state when only the workspace is provided', () => {
    render(<App />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: { ...tableDataFixture, rows: [tableDataFixture.rows[0]] },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    const noExperimentsState = screen.queryByText('No Experiments to Display')
    expect(noExperimentsState).toBeInTheDocument()
  })

  it('should show the experiments table', () => {
    render(<App />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: tableDataFixture,
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    screen.queryAllByText('Experiment')

    const loadingState = screen.queryByText('Loading experiments...')
    expect(loadingState).not.toBeInTheDocument()

    const noExperimentsState = screen.queryByText('No Experiments to Display')
    expect(noExperimentsState).not.toBeInTheDocument()

    const noColumnsState = screen.queryByText('No Columns Selected')
    expect(noColumnsState).not.toBeInTheDocument()
  })

  it('Should persist dvcRoot when the message to update it is given', () => {
    render(<App />)
    const dvcRoot = 'testDvcRoot'
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          dvcRoot,
          type: MessageToWebviewType.SET_DVC_ROOT
        }
      })
    )
    expect(mockSetState).toBeCalledWith({ dvcRoot })
  })

  it('should be able to order a column to the final space after a new column is added', async () => {
    const view = render(<App />)
    mockDndElSpacing(view)
    mockGetComputedSpacing()
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: sortingTableDataFixture,
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    const changedData: TableData = {
      ...sortingTableDataFixture,
      columns: [
        ...sortingTableDataFixture.columns,
        {
          ...commonColumnFields,
          id: 'D',
          name: 'D',
          path: 'params:D'
        }
      ]
    }

    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: changedData,
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    await makeDnd({
      direction: DND_DIRECTION_RIGHT,
      getByText: view.getByText,
      getDragEl: makeGetDragEl('B'),
      positions: 2
    })

    await expectHeaders(['A', 'C', 'D', 'B'])
  })

  describe('Row expansion', () => {
    const experimentLabel = '1ba7bcd'
    const checkpointLabel = '22e40e1'

    it('should maintain expansion status when rows are reordered', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.getByText(checkpointLabel)).toBeInTheDocument()

      const testRow = getRow(experimentLabel)
      const expandButton = within(testRow).getByTitle('Contract Row')
      fireEvent.click(expandButton)

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()

      const changedData: TableData = {
        ...tableDataFixture,
        rows: [
          tableDataFixture.rows[0],
          {
            ...tableDataFixture.rows[1],
            subRows: [
              ...(tableDataFixture.rows[1].subRows as RowData[])
            ].reverse()
          }
        ]
      }

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: changedData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()
    })

    it('should maintain expansion status when the branch changes', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.getByText(checkpointLabel)).toBeInTheDocument()

      const testRow = getRow(experimentLabel)
      const expandButton = within(testRow).getByTitle('Contract Row')
      fireEvent.click(expandButton)

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()

      const changedBranchName = 'changed-branch'

      const changedRows = [...tableDataFixture.rows]
      changedRows[1] = {
        ...changedRows[1],
        id: changedBranchName,
        label: changedBranchName,
        name: changedBranchName,
        sha: '99999dfb4aa5fb41915610c3a256b418fc095610'
      }
      const changedData: TableData = {
        ...tableDataFixture,
        rows: changedRows
      }

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: changedData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      expect(screen.getByText(changedBranchName)).toBeInTheDocument()
      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()
    })

    it('should not toggle an experiment when using the row expansion button', () => {
      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      const testRow = getRow(experimentLabel)
      const expandButton = within(testRow).getByTitle('Contract Row')

      mockPostMessage.mockClear()

      fireEvent.click(expandButton)
      expect(mockPostMessage).not.toBeCalled()

      fireEvent.keyDown(expandButton, {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
        keyCode: 13
      })
      expect(mockPostMessage).not.toBeCalled()
    })
  })

  describe('Toggle experiment status', () => {
    it('should send a message to the extension to toggle an experiment when the row is clicked', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      const testClick = (label: string, id = label) => {
        mockPostMessage.mockReset()

        fireEvent.click(screen.getByText(label))

        expect(mockPostMessage).toBeCalledTimes(1)
        expect(mockPostMessage).toBeCalledWith({
          payload: id,
          type: MessageFromWebviewType.EXPERIMENT_TOGGLED
        })
      }

      testClick('workspace')
      testClick('main')
      testClick('[exp-e7a67]', 'exp-e7a67')
      testClick('22e40e1', '22e40e1fa3c916ac567f69b85969e3066a91dda4')
      testClick('e821416', 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361')
    })

    it('should send a message to the extension to invoke a context menu when a row is right-clicked', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      const testContextMenu = (
        label: string,
        {
          depth = 1,
          id = label,
          queued = false,
          running = false
        }: Partial<ContextMenuPayload> = {}
      ) => {
        mockPostMessage.mockReset()

        fireEvent.contextMenu(screen.getByText(label))

        expect(mockPostMessage).toBeCalledTimes(1)
        expect(mockPostMessage).toBeCalledWith({
          payload: { depth, id, queued, running },
          type: MessageFromWebviewType.CONTEXT_MENU_INVOKED
        })
      }

      testContextMenu('workspace', { depth: 0, running: true })
      testContextMenu('main', { depth: 0 })
      testContextMenu('[exp-e7a67]', {
        depth: 1,
        id: 'exp-e7a67',
        running: true
      })
      testContextMenu('22e40e1', {
        depth: 2,
        id: '22e40e1fa3c916ac567f69b85969e3066a91dda4'
      })
      testContextMenu('e821416', {
        depth: 2,
        id: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361'
      })
    })

    it('should send a message to the extension to toggle an experiment when Enter or Space is pressed on the row', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableDataFixture,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      mockPostMessage.mockClear()

      const testRowLabel = screen.getByText('main')

      testRowLabel.focus()

      fireEvent.keyDown(testRowLabel, {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
        keyCode: 13
      })
      expect(mockPostMessage).toBeCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.EXPERIMENT_TOGGLED
      })
      mockPostMessage.mockClear()

      fireEvent.keyDown(testRowLabel, {
        bubbles: true,
        charCode: 32,
        code: 'Space',
        key: ' ',
        keyCode: 32
      })
      expect(mockPostMessage).toBeCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.EXPERIMENT_TOGGLED
      })
      mockPostMessage.mockClear()

      fireEvent.keyDown(testRowLabel, {
        bubbles: true,
        code: 'keyA',
        key: 'a'
      })
      expect(mockPostMessage).not.toBeCalled()
    })
  })

  describe('Tooltips', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    const testParamName = 'test_param_with_long_name'
    const testParamPath = joinMetricOrParamPath(
      'params',
      'params.yaml',
      testParamName
    )
    const testParamStringValue = 'Test Value'
    const testMetricNumberValue = 1.9293040037155151

    const testData = {
      ...tableDataFixture,
      columns: [
        {
          group: 'metrics',
          hasChildren: true,
          name: 'summary.json',
          parentPath: joinMetricOrParamPath('metrics'),
          path: joinMetricOrParamPath('metrics', 'summary.json')
        },
        {
          group: 'metrics',
          hasChildren: false,
          maxNumber: testMetricNumberValue,
          maxStringLength: 18,
          minNumber: testMetricNumberValue,
          name: 'loss',
          parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
          path: joinMetricOrParamPath('metrics', 'summary.json', 'loss'),
          pathArray: ['metrics', 'summary.json', 'loss'],
          types: ['number']
        },
        {
          group: 'params',
          hasChildren: true,
          name: 'params.yaml',
          parentPath: joinMetricOrParamPath('params'),
          path: joinMetricOrParamPath('params', 'params.yaml')
        },
        {
          group: 'params',
          hasChildren: false,
          maxStringLength: 10,
          name: testParamName,
          parentPath: joinMetricOrParamPath('params', 'params.yaml'),
          path: testParamPath,
          pathArray: ['params', 'params.yaml', testParamName],
          types: ['string']
        }
      ],
      rows: [
        {
          id: 'workspace',
          label: 'workspace',
          metrics: {
            'summary.json': {
              loss: testMetricNumberValue
            }
          },
          mutable: false,
          params: {
            'params.yaml': {
              [testParamName]: testParamStringValue
            }
          }
        },
        {
          id: 'main',
          label: 'main',
          metrics: {
            'summary.json': {
              loss: testMetricNumberValue + 1
            }
          },
          mutable: false,
          params: {
            'params.yaml': {
              [testParamName]: 'Other Value'
            }
          }
        }
      ]
    }

    it('should show and hide a tooltip on mouseEnter and mouseLeave of a header', () => {
      mockedUseIsFullyContained.mockReturnValue(false)

      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: testData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      const testParamHeader = screen.getByText(testParamName)

      fireEvent.mouseEnter(testParamHeader, { bubbles: true })
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      jest.advanceTimersByTime(HEADER_TOOLTIP_DELAY - 1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      jest.advanceTimersByTime(1)
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
      expect(screen.getByRole('tooltip')).toHaveTextContent(testParamName)

      fireEvent.mouseLeave(testParamHeader, { bubbles: true })

      jest.advanceTimersByTime(HEADER_TOOLTIP_DELAY - 1)
      expect(screen.getByRole('tooltip')).toBeInTheDocument()

      jest.advanceTimersByTime(1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('should not show a tooltip after hovering on a header if its content is not overflowing', () => {
      mockedUseIsFullyContained.mockReturnValue(true)

      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: testData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      const testParamHeader = screen.getByText(testParamName)

      fireEvent.mouseEnter(testParamHeader, { bubbles: true })
      jest.advanceTimersByTime(HEADER_TOOLTIP_DELAY)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('should show and hide a tooltip on mouseEnter and mouseLeave of a cell', () => {
      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => window.setTimeout(cb, 1))
      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: testData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const testParamCell = screen.getByText(testParamStringValue)
      fireEvent.mouseEnter(testParamCell, { bubbles: true })

      jest.advanceTimersByTime(CELL_TOOLTIP_DELAY - 1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      jest.advanceTimersByTime(1)
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()

      expect(tooltip).toHaveTextContent(`Parameter: ${testParamStringValue}`)

      fireEvent.mouseLeave(testParamCell, { bubbles: true })

      jest.advanceTimersByTime(1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      jest.mocked(window.requestAnimationFrame).mockRestore()
    })

    it('should show a tooltip with the full number on number cells', () => {
      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: testData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const testMetricCell = screen.getByText('1.9293')
      fireEvent.mouseEnter(testMetricCell, { bubbles: true })

      jest.advanceTimersByTime(CELL_TOOLTIP_DELAY)
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent(
        `Metric: ${String(testMetricNumberValue)}`
      )
    })
  })
})
