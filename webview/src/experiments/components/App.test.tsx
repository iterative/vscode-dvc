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
import {
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
  describe('Given an initial empty state', () => {
    describe('When we render the App', () => {
      it('Then a message should be sent to the extension on the first render', () => {
        render(<App />)
        expect(mockPostMessage).toHaveBeenCalledWith({
          type: MessageFromWebviewType.INITIALIZED
        })

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
      })

      it('Then the empty state should be displayed', async () => {
        render(<App />)
        const emptyState = await screen.findByText('Loading experiments...')

        expect(emptyState).toBeInTheDocument()
      })
    })
  })

  describe('Given a message to add experiments to the state', () => {
    const messageToChangeState = new MessageEvent('message', {
      data: {
        data: tableDataFixture,
        type: MessageToWebviewType.SET_DATA
      }
    })

    describe('When we render the App and send the message', () => {
      it('Then the experiments table should be shown', () => {
        render(<App />)
        fireEvent(window, messageToChangeState)

        screen.queryAllByText('Experiment')
        const emptyState = screen.queryByText('Loading experiments...')
        expect(emptyState).not.toBeInTheDocument()
      })
    })
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

      const testRow = screen
        .getAllByRole('row')
        .find(row => within(row).queryByText(experimentLabel)) as HTMLElement
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

      const testRow = screen
        .getAllByRole('row')
        .find(row => within(row).queryByText(experimentLabel)) as HTMLElement
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
      const testRow = screen
        .getAllByRole('row')
        .find(row => within(row).queryByText(experimentLabel)) as HTMLElement
      const expandButton = within(testRow).getByTitle('Contract Row')

      mockPostMessage.mockClear()

      fireEvent.click(expandButton)
      expect(mockPostMessage).not.toBeCalled()

      fireEvent.keyUp(expandButton, {
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

      fireEvent.keyUp(testRowLabel, {
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

      fireEvent.keyUp(testRowLabel, {
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

      fireEvent.keyUp(testRowLabel, {
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
