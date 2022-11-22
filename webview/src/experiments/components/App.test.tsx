/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import {
  cleanup,
  createEvent,
  fireEvent,
  screen,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/base/tableData'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Column, ColumnType } from 'dvc/src/experiments/webview/contract'
import { buildMetricOrParamPath } from 'dvc/src/experiments/columns/paths'
import dataTypesTableFixture from 'dvc/src/test/fixtures/expShow/dataTypes/tableData'
import { useIsFullyContained } from './overflowHoverTooltip/useIsFullyContained'
import styles from './table/styles.module.scss'
import { vsCodeApi } from '../../shared/api'
import {
  commonColumnFields,
  expectHeaders,
  tableData as sortingTableDataFixture
} from '../../test/sort'
import {
  NORMAL_TOOLTIP_DELAY,
  HEADER_TOOLTIP_DELAY
} from '../../shared/components/tooltip/Tooltip'
import { getRow } from '../../test/queries'
import { dragAndDrop } from '../../test/dragDrop'
import { DragEnterDirection } from '../../shared/components/dragDrop/util'
import { setExperimentsAsStarred } from '../../test/tableDataFixture'
import {
  advanceTimersByTime,
  clickRowCheckbox,
  contractRow,
  getCheckboxCountIndicator,
  getCountIndicatorById,
  getCountIndicators,
  renderTable,
  renderTableWithNoColumns,
  renderTableWithSortingData,
  renderTableWithWorkspaceRowOnly,
  setTableData
} from '../../test/experimentsTable'
import { clearSelection, createWindowTextSelection } from '../../test/selection'

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

describe('App', () => {
  it('should send a message to the extension on the first render', () => {
    renderTable(undefined, true)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZED
    })

    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should display the loading state before the experiments are shown', async () => {
    renderTable(undefined, true)

    const loadingState = await screen.findByText('Loading Experiments...')
    expect(loadingState).toBeInTheDocument()
  })

  it('should show the no columns selected empty state when there are no columns provided', () => {
    renderTableWithNoColumns()

    const noColumnsState = screen.queryByText('No Columns Selected.')
    expect(noColumnsState).toBeInTheDocument()
  })

  it('should not show the no columns selected empty state when only the timestamp column is provided', () => {
    renderTable({
      ...tableDataFixture,
      columns: tableDataFixture.columns.filter(
        ({ label }) => label === 'Created'
      )
    })

    const noColumnsState = screen.queryByText('No Columns Selected.')
    expect(noColumnsState).not.toBeInTheDocument()
  })

  it('should show the no experiments empty state when only the workspace is provided', () => {
    renderTableWithWorkspaceRowOnly()

    const noExperimentsState = screen.queryByText('No Experiments to Display.')
    expect(noExperimentsState).toBeInTheDocument()
  })

  it('should show the experiments table', () => {
    renderTable()

    screen.queryAllByText('Experiment')

    const loadingState = screen.queryByText('Loading experiments...')
    expect(loadingState).not.toBeInTheDocument()

    const noExperimentsState = screen.queryByText('No Experiments to Display.')
    expect(noExperimentsState).not.toBeInTheDocument()

    const noColumnsState = screen.queryByText('No Columns Selected.')
    expect(noColumnsState).not.toBeInTheDocument()
  })

  it('should be able to order a column to the final space after a new column is added', async () => {
    const { getDraggableHeaderFromText } = renderTableWithSortingData()

    setTableData({
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
    })

    const headerB = screen.getByText('B')
    const headerD = getDraggableHeaderFromText('D')

    dragAndDrop(headerB, headerD, DragEnterDirection.AUTO)

    await expectHeaders(['A', 'C', 'D', 'B'])
  })

  describe('Sub-rows middle states indicators', () => {
    const testRowLabel = '4fb124a'

    const getMiddleStatesTestRow = () => {
      return getRow(testRowLabel)
    }

    const selectSomeSubRows = () => {
      clickRowCheckbox('d1343a8')
      clickRowCheckbox('1ee5f2e')

      return 2
    }

    const starSomeSubRows = () => {
      const starredFixture = setExperimentsAsStarred(tableDataFixture, [
        'd1343a8',
        '1ee5f2e'
      ])

      setTableData(starredFixture)

      return 2
    }

    it('should be hidden when the parent row is expanded', () => {
      renderTable()
      const row = getMiddleStatesTestRow()
      const indicators = getCountIndicators(row)
      expect(indicators).toHaveLength(0)
    })

    describe('Checkbox selection counter', () => {
      it('should not be visible if no sub-row was checked', () => {
        renderTable()
        const row = getMiddleStatesTestRow()
        const indicator = getCheckboxCountIndicator(row)
        expect(indicator).not.toBeInTheDocument()
      })

      it('should display the correct number of checked sub-rows when the parent is collapsed', () => {
        renderTable()
        const row = getMiddleStatesTestRow()
        const numberOfSubrowsSelected = selectSomeSubRows()
        expect(getCheckboxCountIndicator(row)).not.toBeInTheDocument()
        contractRow(testRowLabel)
        const collapsed = getMiddleStatesTestRow()
        expect(getCheckboxCountIndicator(collapsed)).toHaveTextContent(
          `${numberOfSubrowsSelected}`
        )
      })
    })

    describe('Stars counter', () => {
      it('should not be visible if no sub-row was starred', () => {
        renderTable()
        const row = getMiddleStatesTestRow()
        const indicator = getCountIndicatorById(row, 'row-action-star')
        expect(indicator).not.toBeInTheDocument()
      })

      it('should display the correct number of starred sub-rows when the parent is collapsed', () => {
        renderTable()
        const row = getMiddleStatesTestRow()
        const numberOfSubrowsStarred = starSomeSubRows()
        expect(
          getCountIndicatorById(row, 'row-action-star')
        ).not.toBeInTheDocument()
        contractRow(testRowLabel)
        const collapsed = getMiddleStatesTestRow()
        expect(
          getCountIndicatorById(collapsed, 'row-action-star')
        ).toHaveTextContent(`${numberOfSubrowsStarred}`)
      })
    })
  })

  describe('Toggle experiment status', () => {
    it('should send a message to the extension to toggle an experiment when the row is clicked', () => {
      renderTable()

      const testClick = (label: string, id = label) => {
        mockPostMessage.mockReset()

        fireEvent.click(screen.getByText(label))

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
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
      renderTable()

      mockPostMessage.mockClear()

      const testRowLabel = screen.getByText('main')

      testRowLabel.focus()

      fireEvent.keyDown(testRowLabel, {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
        keyCode: 13
      })
      expect(mockPostMessage).toHaveBeenCalledWith({
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
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })
      mockPostMessage.mockClear()

      fireEvent.keyDown(testRowLabel, {
        bubbles: true,
        code: 'keyA',
        key: 'a'
      })
      expect(mockPostMessage).not.toHaveBeenCalled()
    })
    it('should not send a message if row label was selected', () => {
      renderTable()
      mockPostMessage.mockClear()

      const testRowId = 'workspace'

      createWindowTextSelection(testRowId, 5)
      fireEvent.click(screen.getByText(testRowId))

      expect(mockPostMessage).not.toHaveBeenCalledTimes(1)
      expect(mockPostMessage).not.toHaveBeenCalledWith({
        payload: testRowId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      mockPostMessage.mockClear()

      clearSelection()
      fireEvent.click(screen.getByText(testRowId))

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: testRowId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })
    })
    it('should send a message if some other label is selected', () => {
      renderTable()
      mockPostMessage.mockClear()

      const selectedTestRowId = 'workspace'
      const testRowId = 'main'

      createWindowTextSelection(selectedTestRowId, 5)
      fireEvent.click(screen.getByText(testRowId))

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: testRowId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })
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
    const testParamPath = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      testParamName
    )
    const testParamStringValue = 'Test Value'
    const testMetricNumberValue = 1.9293040037155151

    const testData = {
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
          hasChildren: false,
          label: 'loss',
          maxNumber: testMetricNumberValue,
          maxStringLength: 18,
          minNumber: testMetricNumberValue,
          parentPath: buildMetricOrParamPath(
            ColumnType.METRICS,
            'summary.json'
          ),
          path: buildMetricOrParamPath(
            ColumnType.METRICS,
            'summary.json',
            'loss'
          ),
          pathArray: [ColumnType.METRICS, 'summary.json', 'loss'],
          type: ColumnType.METRICS,
          types: ['number']
        },
        {
          hasChildren: true,
          label: 'params.yaml',
          parentPath: ColumnType.PARAMS,
          path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: testParamName,
          maxStringLength: 10,
          parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
          path: testParamPath,
          pathArray: [ColumnType.PARAMS, 'params.yaml', testParamName],
          type: ColumnType.PARAMS,
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

      renderTable(testData)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      const testParamHeader = screen.getByText(testParamName)

      fireEvent.mouseEnter(testParamHeader, { bubbles: true })
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      advanceTimersByTime(HEADER_TOOLTIP_DELAY - 1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      advanceTimersByTime(1)
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
      expect(screen.getByRole('tooltip')).toHaveTextContent(testParamName)

      fireEvent.mouseLeave(testParamHeader, { bubbles: true })

      advanceTimersByTime(HEADER_TOOLTIP_DELAY - 1)
      expect(screen.getByRole('tooltip')).toBeInTheDocument()

      advanceTimersByTime(1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('should not show a tooltip after hovering on a header if its content is not overflowing', () => {
      mockedUseIsFullyContained.mockReturnValue(true)

      renderTable(testData)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      const testParamHeader = screen.getByText(testParamName)

      fireEvent.mouseEnter(testParamHeader, { bubbles: true })
      advanceTimersByTime(HEADER_TOOLTIP_DELAY)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('should show and hide a tooltip on mouseEnter and mouseLeave of a cell', () => {
      renderTable(testData)

      const testParamCell = screen.getByText(testParamStringValue)
      fireEvent.mouseEnter(testParamCell, { bubbles: true })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0] - 1)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      advanceTimersByTime(1)
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()

      expect(tooltip).toHaveTextContent(testParamStringValue)

      fireEvent.mouseLeave(testParamCell, { bubbles: true })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('should persist a cell tooltip when it is moused into', () => {
      renderTable(testData)

      const testParamCell = screen.getByText(testParamStringValue)
      fireEvent.mouseEnter(testParamCell, { bubbles: true })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()

      fireEvent.mouseLeave(testParamCell, { bubbles: true })
      fireEvent.mouseEnter(tooltip, { bubbles: true })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
      expect(tooltip).toBeInTheDocument()
    })

    it('should show the expected tooltip for all data types', () => {
      const expectTooltipValue: (args: {
        cellLabel: string
        expectedTooltipResult: string
      }) => void = ({ cellLabel, expectedTooltipResult }) => {
        const testParamCell = screen.getByText(cellLabel)
        expect(testParamCell).toBeInTheDocument()

        fireEvent.mouseEnter(testParamCell, { bubbles: true })

        advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
        const tooltip = screen.queryByRole('tooltip')
        expect(tooltip).toHaveTextContent(expectedTooltipResult)

        fireEvent.mouseLeave(testParamCell, { bubbles: true })

        advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      }

      renderTable(dataTypesTableFixture)

      expectTooltipValue({
        cellLabel: '1.9293',
        expectedTooltipResult: '1.9293040037155151'
      })
      expectTooltipValue({
        cellLabel: 'true',
        expectedTooltipResult: 'true'
      })
      expectTooltipValue({
        cellLabel: 'false',
        expectedTooltipResult: 'false'
      })
      expectTooltipValue({
        cellLabel: '[true, false, string, 2]',
        expectedTooltipResult: '[true, false, string, 2]'
      })
    })

    it('should show the expected tooltip for the plot experiment row action', () => {
      const clickableText = 'Open the plots view'

      renderTable(testData)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      const radioButton = within(getRow('workspace')).getByTestId(
        'row-action-plot'
      )
      fireEvent.mouseEnter(radioButton)

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
      const tooltip = screen.queryByRole('tooltip')

      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent(`Click to plot${clickableText}`)
      const clickableContent = screen.getByText(clickableText)
      fireEvent.click(clickableContent)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW
      })
    })

    it('should show the expected tooltip for the star experiment row action', () => {
      const clickableText = 'Filter experiments by starred'

      renderTable(testData)

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      const radioButton = within(getRow('main')).getByTestId('row-action-star')
      fireEvent.mouseEnter(radioButton)

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])
      const tooltip = screen.queryByRole('tooltip')

      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent(`Click to star${clickableText}`)
      const clickableContent = screen.getByText('Filter experiments by starred')
      fireEvent.click(clickableContent)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER
      })
    })
  })

  describe('Star', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    it('should not be available for the workspace experiment', () => {
      renderTable()

      mockPostMessage.mockReset()
      const workspaceRow = screen.getByTestId('workspace-row')
      const starIcon = within(workspaceRow).getByTestId('star-icon')
      fireEvent.click(starIcon)

      expect(mockPostMessage).not.toHaveBeenCalled()
    })

    it('should toggle the star status of an experiment by clicking the star icon', () => {
      renderTable()

      mockPostMessage.mockReset()
      const mainRow = getRow('main')
      const starIcon = within(mainRow).getByTestId('star-icon')
      fireEvent.click(starIcon)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: ['main'],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
    })

    it('should toggle the star status of an experiment by clicking the ctx menu option', () => {
      renderTable()

      mockPostMessage.mockReset()
      const mainRow = getRow('main')
      fireEvent.contextMenu(mainRow, { bubbles: true })

      advanceTimersByTime(100)

      const starOption = screen.getByText('Star')
      fireEvent.click(starOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: ['main'],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
    })

    it('should toggle the star status of multiple experiments by clicking the ctx menu options', () => {
      renderTable()

      mockPostMessage.mockReset()
      const mainRow = within(getRow('main')).getByRole('checkbox')
      fireEvent.click(mainRow)

      clickRowCheckbox('4fb124a')

      fireEvent.contextMenu(mainRow, { bubbles: true })
      advanceTimersByTime(100)

      const starOption = screen.getByText('Star')
      fireEvent.click(starOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: ['main', 'exp-e7a67'],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
    })
  })

  describe('Context Menu Suppression', () => {
    it('Suppresses the context menu on a table with no data', () => {
      renderTable(undefined, true)
      const target = screen.getByText('Loading Experiments...')
      const contextMenuEvent = createEvent.contextMenu(target)
      fireEvent(target, contextMenuEvent)
      expect(contextMenuEvent.defaultPrevented).toBe(true)
    })

    it('Suppresses the context menu on a table with data', () => {
      renderTable()
      const target = screen.getAllByRole('row')[0]
      const contextMenuEvent = createEvent.contextMenu(target)
      fireEvent(target, contextMenuEvent)
      expect(contextMenuEvent.defaultPrevented).toBe(true)
    })
  })

  it('should show an indicator with the amount of applied filters', () => {
    renderTable({
      ...tableDataFixture,
      filters: []
    })
    const filterIndicator = screen.getByLabelText('filters')
    expect(filterIndicator).toHaveTextContent('')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(filterIndicator)

    const tooltip = screen.getByRole('tooltip')

    expect(tooltip).toHaveTextContent('No Filters Applied')

    const { columns } = tableDataFixture
    const firstFilterPath = columns[columns.length - 1].path
    const secondFilterPath = columns[columns.length - 2].path
    setTableData({
      ...tableDataFixture,
      filters: [firstFilterPath]
    })
    expect(filterIndicator).toHaveTextContent('1')
    expect(tooltip).toHaveTextContent('1 Filter Applied')
    expect(tooltip).toHaveTextContent('0 Experiments, 0 Checkpoints Filtered')

    setTableData({
      ...tableDataFixture,
      filteredCounts: {
        checkpoints: 2,
        experiments: 1
      },
      filters: [firstFilterPath, secondFilterPath]
    })
    expect(filterIndicator).toHaveTextContent('2')
    expect(tooltip).toHaveTextContent('2 Filters Applied')
    expect(tooltip).toHaveTextContent('1 Experiment, 2 Checkpoints Filtered')

    setTableData({
      ...tableDataFixture,
      filteredCounts: {
        experiments: 10000
      },
      filters: [firstFilterPath, secondFilterPath]
    })
    expect(filterIndicator).toHaveTextContent('2')
    expect(tooltip).toHaveTextContent('Experiment')
    expect(tooltip).not.toHaveTextContent('Checkpoint')

    setTableData({
      ...tableDataFixture,
      filteredCounts: {
        checkpoints: 10000,
        experiments: 10000
      },
      filters: []
    })
    expect(filterIndicator).toHaveTextContent('')
    expect(tooltip).not.toHaveTextContent('Experiment')
    expect(tooltip).not.toHaveTextContent('Checkpoint')
  })

  it('should send a message to focus the relevant tree when clicked', () => {
    renderTable()
    mockPostMessage.mockClear()
    fireEvent.click(screen.getByLabelText('sorts'))
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.FOCUS_SORTS_TREE
    })
    mockPostMessage.mockClear()
    fireEvent.click(screen.getByLabelText('filters'))
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.FOCUS_FILTERS_TREE
    })

    mockPostMessage.mockClear()
    fireEvent.click(screen.getByLabelText('selected for plots'))
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW
    })
  })

  it('should disable text selection while resizing', async () => {
    renderTable()

    expect(document.body).not.toHaveClass(styles.isColumnResizing)

    const [experimentColumnResizeHandle] = await screen.findAllByRole(
      'separator'
    )

    fireEvent.mouseDown(experimentColumnResizeHandle)

    expect(document.body).toHaveClass(styles.isColumnResizing)

    fireEvent.mouseUp(experimentColumnResizeHandle)

    expect(document.body).not.toHaveClass(styles.isColumnResizing)
  })
})
