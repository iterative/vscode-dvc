/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders", "expectTooltipValue"] }] */
import React from 'react'
import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/tableData'
import deeplyNestedTableDataFixture from 'dvc/src/test/fixtures/expShow/deeplyNested'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import {
  Column,
  ColumnType,
  Row,
  TableData
} from 'dvc/src/experiments/webview/contract'
import { buildMetricOrParamPath } from 'dvc/src/experiments/columns/paths'
import { dataTypesTableData } from 'dvc/src/test/fixtures/expShow/dataTypes'
import { App } from './App'
import { useIsFullyContained } from './overflowHoverTooltip/useIsFullyContained'
import styles from './table/styles.module.scss'
import { vsCodeApi } from '../../shared/api'
import {
  commonColumnFields,
  expectHeaders,
  tableData as sortingTableDataFixture
} from '../../test/sort'
import {
  CELL_TOOLTIP_DELAY,
  HEADER_TOOLTIP_DELAY
} from '../../shared/components/tooltip/Tooltip'
import { getRow } from '../../test/queries'
import { dragAndDrop } from '../../test/dragDrop'
import { DragEnterDirection } from '../../shared/components/dragDrop/util'

jest.mock('../../shared/api')
jest.mock('../../util/styles')
jest.mock('./overflowHoverTooltip/useIsFullyContained', () => ({
  useIsFullyContained: jest.fn()
}))
const mockedUseIsFullyContained = jest.mocked(useIsFullyContained)

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

const sourceFilenames: Record<ColumnType, string> = {
  [ColumnType.PARAMS]: 'params.yaml',
  [ColumnType.METRICS]: 'metrics.json',
  [ColumnType.DEPS]: 'data'
}

const buildTestColumn = ({
  name,
  type: columnType = ColumnType.PARAMS,
  sourceFilename = sourceFilenames[columnType],
  ...rest
}: Partial<Column> & {
  name: string
  columnType?: ColumnType
  sourceFilename?: string
}): Column => ({
  hasChildren: false,
  label: name,
  parentPath: buildMetricOrParamPath(columnType, sourceFilename),
  path: buildMetricOrParamPath(columnType, sourceFilename, name),
  pathArray: [columnType, sourceFilename, name],
  type: columnType,
  ...rest
})

const buildTestData: <T = unknown>(
  args: {
    value: T
    name?: string
    otherValue?: T
    types?: string[]
  } & Partial<Column>
) => TableData = ({
  value,
  name = 'test-param',
  types = [typeof value],
  ...rest
}) => {
  return {
    ...tableDataFixture,
    columns: [
      {
        hasChildren: true,
        label: 'summary.json',
        parentPath: buildMetricOrParamPath(ColumnType.METRICS),
        path: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
        type: ColumnType.METRICS
      },
      {
        hasChildren: true,
        label: 'params.yaml',
        parentPath: ColumnType.PARAMS,
        path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
        type: ColumnType.PARAMS
      },
      buildTestColumn({
        name,
        types,
        ...rest
      })
    ],
    rows: [
      {
        id: 'workspace',
        label: 'workspace',
        params: {
          'params.yaml': {
            [name]: value
          }
        }
      },
      {
        id: 'main',
        label: 'main'
      }
    ]
  }
}

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

    const noColumnsState = screen.queryByText('No Columns Selected.')
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

    const noExperimentsState = screen.queryByText('No Experiments to Display.')
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

    const noExperimentsState = screen.queryByText('No Experiments to Display.')
    expect(noExperimentsState).not.toBeInTheDocument()

    const noColumnsState = screen.queryByText('No Columns Selected.')
    expect(noColumnsState).not.toBeInTheDocument()
  })

  it('should be able to order a column to the final space after a new column is added', async () => {
    render(<App />)
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
          label: 'D',
          path: 'params:D'
        } as Column
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

    const headerB = screen.getByText('B')
    const headerD = screen.getByText('D')

    dragAndDrop(headerB, headerD, DragEnterDirection.AUTO)

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
            subRows: [...(tableDataFixture.rows[1].subRows as Row[])].reverse()
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
          type: MessageFromWebviewType.TOGGLE_EXPERIMENT
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

      fireEvent.keyDown(testRowLabel, {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
        keyCode: 13
      })
      expect(mockPostMessage).toBeCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
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
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
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

    const testParamName = 'test-param'
    const testParamStringValue = 'Test String'
    const testData = buildTestData({
      maxStringLength: 10,
      name: testParamName,
      value: testParamStringValue
    })

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

      expect(tooltip).toHaveTextContent(testParamStringValue)

      fireEvent.mouseLeave(testParamCell, { bubbles: true })

      jest.advanceTimersByTime(1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      jest.mocked(window.requestAnimationFrame).mockRestore()
    })

    it('should show the expected tooltip for all values in the data types fixture', async () => {
      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => window.setTimeout(cb, 1))
      const expectTooltipValue: (args: {
        cellLabel: string
        expectedTooltipResult: string
      }) => Promise<void> = async ({ cellLabel, expectedTooltipResult }) => {
        const testCell = screen.getAllByText(cellLabel)?.[0]
        fireEvent.mouseEnter(testCell, { bubbles: true })
        jest.advanceTimersByTime(CELL_TOOLTIP_DELAY)
        const tooltip = await screen.findByRole('tooltip')
        expect(tooltip).toHaveTextContent(expectedTooltipResult)
        jest.useRealTimers()
        await new Promise(resolve => setTimeout(resolve, 1))
        fireEvent.mouseLeave(testCell, { bubbles: true })
        await new Promise(resolve => setTimeout(resolve, 1))
        jest.useFakeTimers()
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      }

      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: dataTypesTableData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      await expectTooltipValue({
        cellLabel: '1.9293',
        expectedTooltipResult: '1.9293040037155151'
      })
      await expectTooltipValue({
        cellLabel: 'true',
        expectedTooltipResult: 'true'
      })
      await expectTooltipValue({
        cellLabel: 'false',
        expectedTooltipResult: 'false'
      })
      await expectTooltipValue({
        cellLabel: '[true, false, string, 2]',
        expectedTooltipResult: '[true, false, string, 2]'
      })
      jest.mocked(window.requestAnimationFrame).mockRestore()
    })
  })

  describe('Row Context Menu', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    it('should be available when there is data and no running experiments', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const target = screen.getByTestId('workspace-row')
      fireEvent.contextMenu(target, { bubbles: true })

      jest.advanceTimersByTime(100)
      const menu = screen.getByTestId('messages-menu')
      expect(menu).toBeDefined()
    })

    it('should present the correct options for the workspace row with no checkpoints', () => {
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

      const target = screen.getByTestId('workspace-row')
      fireEvent.contextMenu(target, { bubbles: true })

      jest.advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toStrictEqual(['Modify and Run', 'Modify and Queue'])
    })

    it('should present the correct options for the main row with checkpoints', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const target = screen.getByText('main')
      fireEvent.contextMenu(target, { bubbles: true })

      jest.advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toStrictEqual([
        'Modify and Resume',
        'Modify, Reset and Run',
        'Modify and Queue',
        'Star Experiment'
      ])
    })

    it('should present the Remove experiment option for the checkpoint tips', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      jest.advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Remove')
    })

    it('should present the Remove option if multiple checkpoint tip rows are selected', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const firstRowCheckbox = within(getRow('4fb124a')).getByRole('checkbox')
      fireEvent.click(firstRowCheckbox)

      const secondRowCheckbox = within(getRow('42b8736')).getByRole('checkbox')
      fireEvent.click(secondRowCheckbox)

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      jest.advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Remove Selected Rows')
    })

    it('should allow batch selection of rows by shift-clicking a range of them', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const firstRowCheckbox = within(getRow('4fb124a')).getByRole('checkbox')
      fireEvent.click(firstRowCheckbox)

      const tailRow = within(getRow('42b8736')).getByRole('checkbox')
      fireEvent.click(tailRow, { shiftKey: true })

      const selectedRows = screen.getAllByRole('row', { selected: true })
      expect(selectedRows.length).toBe(4)

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      jest.advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Star Experiments')
    })
  })

  describe('Star Experiments', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    it('should not be available for the workspace experiment', () => {
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

      mockPostMessage.mockReset()
      const workspaceRow = screen.getByTestId('workspace-row')
      const starIcon = within(workspaceRow).getByTestId('star-icon')
      fireEvent.click(starIcon)

      expect(mockPostMessage).not.toBeCalled()
    })

    it('should toggle the star status of an experiment by clicking the star icon', () => {
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

      mockPostMessage.mockReset()
      const mainRow = getRow('main')
      const starIcon = within(mainRow).getByTestId('star-icon')
      fireEvent.click(starIcon)

      expect(mockPostMessage).toBeCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: ['main'],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
    })

    it('should toggle the star status of an experiment by clicking the ctx menu option', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      mockPostMessage.mockReset()
      const mainRow = getRow('main')
      fireEvent.contextMenu(mainRow, { bubbles: true })

      jest.advanceTimersByTime(100)

      const starOption = screen.getByText('Star Experiment')
      fireEvent.click(starOption)

      expect(mockPostMessage).toBeCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: ['main'],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
    })

    it('should toggle the star status of multiple experiments by clicking the ctx menu options', () => {
      render(<App />)

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              hasRunningExperiment: false
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      mockPostMessage.mockReset()
      const mainRow = within(getRow('main')).getByRole('checkbox')
      fireEvent.click(mainRow)

      const firstTipRow = within(getRow('4fb124a')).getByRole('checkbox')
      fireEvent.click(firstTipRow)

      fireEvent.contextMenu(mainRow, { bubbles: true })
      jest.advanceTimersByTime(100)

      const starOption = screen.getByText('Star Experiments')
      fireEvent.click(starOption)

      expect(mockPostMessage).toBeCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: ['main', 'exp-e7a67'],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
    })
  })

  describe('Context Menu Suppression', () => {
    it('Suppresses the context menu on a table with no data', () => {
      render(<App />)
      const target = screen.getByText('Loading Experiments...')
      const contextMenuEvent = createEvent.contextMenu(target)
      fireEvent(target, contextMenuEvent)
      expect(contextMenuEvent.defaultPrevented).toBe(true)
    })

    it('Suppresses the context menu on a table with data', () => {
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
      const target = screen.getAllByRole('row')[0]
      const contextMenuEvent = createEvent.contextMenu(target)
      fireEvent(target, contextMenuEvent)
      expect(contextMenuEvent.defaultPrevented).toBe(true)
    })
  })

  describe('Sort and Filter Indicators', () => {
    it('should show an indicator with the amount of applied sorts', () => {
      render(<App />)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              sorts: []
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      const sortIndicator = screen.getByLabelText('sorts')
      expect(sortIndicator).toHaveTextContent('')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(sortIndicator)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('No Sorts Applied')

      const { columns } = tableDataFixture
      const firstSortPath = columns[columns.length - 1].path
      const secondSortPath = columns[columns.length - 2].path
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              sorts: [{ descending: true, path: firstSortPath }]
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      expect(sortIndicator).toHaveTextContent('1')
      expect(tooltip).toHaveTextContent('1 Sort Applied')
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: {
              ...tableDataFixture,
              sorts: [
                { descending: true, path: firstSortPath },
                { descending: false, path: secondSortPath }
              ]
            },
            type: MessageToWebviewType.SET_DATA
          }
        })
      )
      expect(sortIndicator).toHaveTextContent('2')
      expect(tooltip).toHaveTextContent('2 Sorts Applied')
    })
  })

  it('should show an indicator with the amount of applied filters', () => {
    render(<App />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: {
            ...tableDataFixture,
            filters: []
          },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )
    const filterIndicator = screen.getByLabelText('filters')
    expect(filterIndicator).toHaveTextContent('')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(filterIndicator)

    const tooltip = screen.getByRole('tooltip')

    expect(tooltip).toHaveTextContent('No Filters Applied')

    const { columns } = tableDataFixture
    const firstFilterPath = columns[columns.length - 1].path
    const secondFilterPath = columns[columns.length - 2].path
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: {
            ...tableDataFixture,
            filters: [firstFilterPath]
          },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )
    expect(filterIndicator).toHaveTextContent('1')
    expect(tooltip).toHaveTextContent('1 Filter Applied')
    expect(tooltip).toHaveTextContent('0 Experiments, 0 Checkpoints Filtered')

    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: {
            ...tableDataFixture,
            filteredCounts: {
              checkpoints: 2,
              experiments: 1
            },
            filters: [firstFilterPath, secondFilterPath]
          },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )
    expect(filterIndicator).toHaveTextContent('2')
    expect(tooltip).toHaveTextContent('2 Filters Applied')
    expect(tooltip).toHaveTextContent('1 Experiment, 2 Checkpoints Filtered')

    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: {
            ...tableDataFixture,
            filteredCounts: {
              experiments: 10000
            },
            filters: [firstFilterPath, secondFilterPath]
          },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )
    expect(filterIndicator).toHaveTextContent('2')
    expect(tooltip).toHaveTextContent('Experiment')
    expect(tooltip).not.toHaveTextContent('Checkpoint')

    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: {
            ...tableDataFixture,
            filteredCounts: {
              checkpoints: 10000,
              experiments: 10000
            },
            filters: []
          },
          type: MessageToWebviewType.SET_DATA
        }
      })
    )
    expect(filterIndicator).toHaveTextContent('')
    expect(tooltip).not.toHaveTextContent('Experiment')
    expect(tooltip).not.toHaveTextContent('Checkpoint')
  })

  it('should send a message to focus the relevant tree when clicked', () => {
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
    fireEvent.click(screen.getByLabelText('sorts'))
    expect(mockPostMessage).toBeCalledWith({
      type: MessageFromWebviewType.FOCUS_SORTS_TREE
    })
    mockPostMessage.mockClear()
    fireEvent.click(screen.getByLabelText('filters'))
    expect(mockPostMessage).toBeCalledWith({
      type: MessageFromWebviewType.FOCUS_FILTERS_TREE
    })
  })
})
