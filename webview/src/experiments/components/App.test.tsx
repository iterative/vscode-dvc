/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  screen,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/base/tableData'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Column, ColumnType, Row } from 'dvc/src/experiments/webview/contract'
import { buildMetricOrParamPath } from 'dvc/src/experiments/columns/paths'
import dataTypesTableFixture from 'dvc/src/test/fixtures/expShow/dataTypes/tableData'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
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
  expandRow,
  getCheckboxCountIndicator,
  getCountIndicatorById,
  getCountIndicators,
  renderTable,
  renderTableWithNoColumns,
  renderTableWithoutRunningExperiments,
  renderTableWithPlaceholder,
  renderTableWithSortingData,
  renderTableWithWorkspaceRowOnly,
  selectedRows,
  setTableData
} from '../../test/experimentsTable'
import { clearSelection, createWindowTextSelection } from '../../test/selection'
import { sendMessage } from '../../shared/vscode'

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
  describe('Sorting Classes', () => {
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

  describe('Row expansion', () => {
    const experimentLabel = '1ba7bcd'
    const checkpointLabel = '22e40e1'

    it('should maintain expansion status when rows are reordered', () => {
      renderTable()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.getByText(checkpointLabel)).toBeInTheDocument()

      const testRow = getRow(experimentLabel)
      const expandButton = within(testRow).getByTitle('Contract Row')
      fireEvent.click(expandButton)

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()

      setTableData({
        ...tableDataFixture,
        rows: [
          tableDataFixture.rows[0],
          {
            ...tableDataFixture.rows[1],
            subRows: [...(tableDataFixture.rows[1].subRows as Row[])].reverse()
          }
        ]
      })

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()
    })

    it('should maintain expansion status when the commit changes', () => {
      renderTable()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.getByText(checkpointLabel)).toBeInTheDocument()

      const testRow = getRow(experimentLabel)
      const expandButton = within(testRow).getByTitle('Contract Row')
      fireEvent.click(expandButton)

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()

      const changedCommitName = 'changed-branch'

      const changedRows = [...tableDataFixture.rows]
      changedRows[1] = {
        ...changedRows[1],
        id: changedCommitName,
        label: changedCommitName,
        name: changedCommitName,
        sha: '99999dfb4aa5fb41915610c3a256b418fc095610'
      }

      setTableData({
        ...tableDataFixture,
        rows: changedRows
      })

      expect(screen.getByText(changedCommitName)).toBeInTheDocument()
      expect(screen.getByText(experimentLabel)).toBeInTheDocument()
      expect(screen.queryByText(checkpointLabel)).not.toBeInTheDocument()
    })

    it('should not toggle an experiment when using the row expansion button', () => {
      renderTable()
      const testRow = getRow(experimentLabel)
      const expandButton = within(testRow).getByTitle('Contract Row')

      mockPostMessage.mockClear()

      fireEvent.click(expandButton)
      expect(mockPostMessage).not.toHaveBeenCalled()

      fireEvent.keyDown(expandButton, {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
        keyCode: 13
      })
      expect(mockPostMessage).not.toHaveBeenCalled()
    })
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

      testClick(EXPERIMENT_WORKSPACE_ID)
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

      const testRowId = EXPERIMENT_WORKSPACE_ID

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

      const selectedTestRowId = EXPERIMENT_WORKSPACE_ID
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
          id: EXPERIMENT_WORKSPACE_ID,
          label: EXPERIMENT_WORKSPACE_ID,
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
        cellLabel: '1.9293040',
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

      const radioButton = within(getRow(EXPERIMENT_WORKSPACE_ID)).getByTestId(
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

  describe('Header Context Menu', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    it('should not open on left click', () => {
      renderTableWithoutRunningExperiments()

      const paramsFileHeader = screen.getByText('params.yaml')
      fireEvent.click(paramsFileHeader, { bubbles: true })

      act(() => {
        advanceTimersByTime(100)
      })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should open on right click and close on esc', () => {
      renderTableWithoutRunningExperiments()

      const paramsFileHeader = screen.getByText('params.yaml')
      fireEvent.contextMenu(paramsFileHeader, { bubbles: true })

      advanceTimersByTime(100)

      const menuitems = screen.getAllByRole('menuitem')
      expect(menuitems).toHaveLength(3)

      fireEvent.keyDown(paramsFileHeader, { bubbles: true, key: 'Escape' })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should have the same options in the empty placeholders', () => {
      renderTableWithPlaceholder()
      const header = screen.getByTestId('header-Created')
      const placeholders = screen.getAllByTestId(/header-Created.+placeholder/)
      const entireColumn = [header, ...placeholders]

      expect(entireColumn).toHaveLength(5)

      for (const segment of entireColumn) {
        fireEvent.contextMenu(segment, { bubbles: true })
        jest.advanceTimersByTime(100)
        const menuitems = screen
          .getAllByRole('menuitem')
          .map(item => item.textContent)

        expect(menuitems).toStrictEqual([
          'Hide Column',
          'Set Max Header Height',
          'Sort Ascending',
          'Sort Descending'
        ])

        fireEvent.keyDown(segment, { bubbles: true, key: 'Escape' })
      }
    })

    it('should have the same options in the empty placeholders of the Experiment column', () => {
      renderTableWithPlaceholder()
      const header = screen.getByTestId('header-id')
      const placeholders = screen.getAllByTestId(/header-id.+placeholder/)
      const entireColumn = [header, ...placeholders]

      expect(entireColumn).toHaveLength(5)

      for (const segment of entireColumn) {
        fireEvent.contextMenu(segment, { bubbles: true })
        jest.advanceTimersByTime(100)
        const menuitems = screen
          .getAllByRole('menuitem')
          .map(item => item.textContent)

        expect(menuitems).toStrictEqual(['Set Max Header Height'])

        fireEvent.keyDown(segment, { bubbles: true, key: 'Escape' })
      }
    })

    describe('Hiding a column from its empty placeholder', () => {
      it('should send the column id and not the placeholder id as the message payload', () => {
        renderTableWithPlaceholder()
        const placeholders = screen.getAllByTestId(
          /header-Created.+placeholder/
        )
        const placeholder = placeholders[0]
        fireEvent.contextMenu(placeholder, { bubbles: true })
        jest.advanceTimersByTime(100)

        const hideOption = screen.getByText('Hide Column')

        mockPostMessage.mockClear()

        fireEvent.click(hideOption)

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          payload: 'Created',
          type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
        })
      })
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
      renderTableWithoutRunningExperiments()

      const target = screen.getByTestId('workspace-row')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menu = screen.getByTestId('messages-menu')
      expect(menu).toBeDefined()
    })

    it('should present the correct options for the workspace row with no checkpoints', () => {
      renderTableWithPlaceholder()

      const target = screen.getByTestId('workspace-row')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toStrictEqual(['Modify and Run', 'Modify and Queue'])
    })

    it('should present the correct options for the main row with checkpoints', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('main')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toStrictEqual([
        'Modify and Run',
        'Modify and Resume',
        'Modify and Queue',
        'Star'
      ])
    })

    it('should present the correct option for an experiment with checkpoints and close on esc', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('[exp-e7a67]')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toStrictEqual([
        'Show Logs',
        'Apply to Workspace',
        'Create new Branch',
        'Share to Studio',
        'Commit and Share',
        'Share as Branch',
        'Modify and Run',
        'Modify and Resume',
        'Modify and Queue',
        'Star',
        'Stop',
        'Remove'
      ])

      fireEvent.keyDown(menuitems[0], { bubbles: true, key: 'Escape' })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should be removed with a left click', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.getAllByRole('menuitem')).toHaveLength(12)

      fireEvent.click(window, { bubbles: true })
      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should be removed with a left click on a different row', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.getAllByRole('menuitem')).toHaveLength(12)

      const commit = getRow('main')
      fireEvent.click(commit, { bubbles: true })
      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should be moved with a right click on the same row (not toggle)', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(12)

      fireEvent.contextMenu(within(row).getByText('[exp-e7a67]'), {
        bubbles: true
      })
      advanceTimersByTime(200)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(12)
    })

    it('should present the Remove experiment option for the checkpoint tips', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Remove')
    })

    it('should present the Remove option if multiple checkpoint tip rows are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Remove Selected Rows')

      const removeOption = menuitems.find(item =>
        item.textContent?.includes('Remove Selected Rows')
      )

      expect(removeOption).toBeDefined()

      removeOption && fireEvent.click(removeOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'test-branch'],
        type: MessageFromWebviewType.REMOVE_EXPERIMENT
      })
    })

    it('should present the stop option if only running experiments are selected', () => {
      renderTable()

      clickRowCheckbox('4fb124a')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Stop')

      const stopOption = menuitems.find(item =>
        item.textContent?.includes('Stop')
      )

      expect(stopOption).toBeDefined()

      stopOption && fireEvent.click(stopOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: [{ executor: 'dvc-task', id: 'exp-e7a67' }],
        type: MessageFromWebviewType.STOP_EXPERIMENT
      })
    })

    it('should enable the user to stop an experiment running in the workspace', () => {
      renderTable()

      const target = screen.getByText(EXPERIMENT_WORKSPACE_ID)
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Stop')

      const stopOption = menuitems.find(item =>
        item.textContent?.includes('Stop')
      )

      expect(stopOption).toBeDefined()

      stopOption && fireEvent.click(stopOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: [
          { executor: EXPERIMENT_WORKSPACE_ID, id: EXPERIMENT_WORKSPACE_ID }
        ],
        type: MessageFromWebviewType.STOP_EXPERIMENT
      })
    })

    it('should enable the user to share an experiment to Studio', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Share to Studio')

      const shareOption = menuitems.find(item =>
        item.textContent?.includes('Share to Studio')
      )

      expect(shareOption).toBeDefined()

      shareOption && fireEvent.click(shareOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: 'exp-e7a67',
        type: MessageFromWebviewType.SHARE_EXPERIMENT_TO_STUDIO
      })
    })

    it('should not enable the user share a checkpoint or commit to Studio', () => {
      renderTableWithoutRunningExperiments()

      const commitTarget = screen.getByText('main')
      fireEvent.contextMenu(commitTarget, { bubbles: true })

      advanceTimersByTime(100)
      const commitMenuitems = screen.getAllByRole('menuitem')
      const commitItemLabels = commitMenuitems.map(item => item.textContent)
      expect(commitItemLabels).not.toHaveLength(0)
      expect(commitItemLabels).not.toContain('Share to Studio')

      const checkpointTarget = screen.getByText('d1343a8')
      fireEvent.contextMenu(checkpointTarget, { bubbles: true })

      advanceTimersByTime(100)
      const checkpointMenuitems = screen.getAllByRole('menuitem')
      const checkpointItemLabels = checkpointMenuitems.map(
        item => item.textContent
      )
      expect(checkpointItemLabels).not.toHaveLength(0)
      expect(checkpointItemLabels).not.toContain('Share to Studio')
    })

    it('should always present the Plots options if multiple rows are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Plot and Show')
      expect(itemLabels).toContain('Plot')

      const plotOption = menuitems.find(item =>
        item.textContent?.includes('Plot and Show')
      )

      expect(plotOption).toBeDefined()

      plotOption && fireEvent.click(plotOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'test-branch'],
        type: MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS
      })
    })

    it('should allow batch selection of rows by shift-clicking a range of them', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736', true)

      expect(selectedRows().length).toBe(4)

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Star')
    })

    it('should allow batch selection from the bottom up too', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('42b8736')
      clickRowCheckbox('4fb124a', true)

      expect(selectedRows()).toHaveLength(4)

      clickRowCheckbox('2173124', true)
      expect(selectedRows()).toHaveLength(5)
    })

    it('should not include collapsed experiments in the bulk selection', () => {
      renderTableWithoutRunningExperiments()

      contractRow('42b8736')

      advanceTimersByTime(100)
      clickRowCheckbox('4fb124a')
      clickRowCheckbox('22e40e1', true)
      expandRow('42b8736')

      advanceTimersByTime(100)
      expect(getRow('42b8736')).toHaveAttribute('aria-selected', 'true')
      expect(getRow('2173124')).not.toHaveAttribute('aria-selected', 'true')
      expect(getRow('9523bde')).not.toHaveAttribute('aria-selected', 'true')
    })

    it('should present the Clear selected rows option when multiple rows are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736', true)

      expect(selectedRows().length).toBe(4)

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const clearOption = screen.getByText('Clear row selection')
      fireEvent.click(clearOption)

      advanceTimersByTime(100)
      expect(selectedRows().length).toBe(0)
    })

    it('should clear the row selection when the Escape key is pressed', () => {
      renderTable()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736', true)

      expect(selectedRows().length).toBe(4)

      fireEvent.keyUp(getRow('42b8736'), { bubbles: true, key: 'Escape' })

      advanceTimersByTime(100)
      expect(selectedRows().length).toBe(0)
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

  describe('Header Indicators', () => {
    it('should show an indicator with the amount of experiments selected for plotting', () => {
      renderTable({
        ...tableDataFixture
      })
      const selectedForPlotsIndicator =
        screen.getByLabelText('selected for plots')
      expect(selectedForPlotsIndicator).toHaveTextContent('2')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(selectedForPlotsIndicator)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent(
        '2 Experiments Selected for Plotting (Max 7)'
      )

      setTableData({
        ...tableDataFixture,
        rows: [
          { ...tableDataFixture.rows[0], selected: false },
          { ...tableDataFixture.rows[1], selected: false, subRows: [] }
        ]
      })

      expect(selectedForPlotsIndicator).toHaveTextContent('')
      expect(tooltip).toHaveTextContent(
        'No Experiments Selected for Plotting (Max 7)'
      )

      setTableData({
        ...tableDataFixture,
        rows: [
          { ...tableDataFixture.rows[0], selected: false },
          {
            ...tableDataFixture.rows[1],
            selected: false,
            subRows: [
              {
                ...(tableDataFixture.rows[1]?.subRows?.[0] as Row),
                selected: false,
                subRows: [
                  {
                    ...(tableDataFixture.rows[1]?.subRows?.[1] as Row),
                    selected: true
                  }
                ]
              }
            ]
          }
        ]
      })

      expect(selectedForPlotsIndicator).toHaveTextContent('1')
      expect(tooltip).toHaveTextContent(
        '1 Experiment Selected for Plotting (Max 7)'
      )
    })

    it('should show an indicator with the amount of applied sorts', () => {
      renderTable({
        ...tableDataFixture,
        sorts: []
      })
      const sortIndicator = screen.getByLabelText('sorts')
      expect(sortIndicator).toHaveTextContent('')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(sortIndicator)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('No Sorts Applied')

      const { columns } = tableDataFixture
      const firstSortPath = columns[columns.length - 1].path
      const secondSortPath = columns[columns.length - 2].path
      setTableData({
        ...tableDataFixture,
        sorts: [{ descending: true, path: firstSortPath }]
      })
      expect(sortIndicator).toHaveTextContent('1')
      expect(tooltip).toHaveTextContent('1 Sort Applied')
      setTableData({
        ...tableDataFixture,
        sorts: [
          { descending: true, path: firstSortPath },
          { descending: false, path: secondSortPath }
        ]
      })
      expect(sortIndicator).toHaveTextContent('2')
      expect(tooltip).toHaveTextContent('2 Sorts Applied')
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

  describe('Add configuration button', () => {
    it('should show a add config button if the project has no pipeline stages', () => {
      renderTable()
      setTableData({ ...tableDataFixture, hasConfig: false })

      expect(screen.getByText('Add a Pipeline Stage')).toBeInTheDocument()
    })

    it('should not show a add config button if the project has pipeline stages', () => {
      renderTable()

      expect(screen.queryByText('Add a Pipeline Stage')).not.toBeInTheDocument()
    })

    it('should send a message to the extension to add a pipeline stage when clicking on the add config button', () => {
      renderTable()
      setTableData({ ...tableDataFixture, hasConfig: false })

      fireEvent.click(screen.getByText('Add a Pipeline Stage'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.ADD_CONFIGURATION
      })
    })

    it('should disable the button and add an error message if the dvc.yaml file contains invalid yaml', async () => {
      renderTable()
      setTableData({
        ...tableDataFixture,
        hasConfig: false,
        hasValidDvcYaml: false
      })
      const addPipelineButton = await screen.findByText('Add a Pipeline Stage')

      fireEvent.click(addPipelineButton)

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        type: MessageFromWebviewType.ADD_CONFIGURATION
      })

      expect(
        screen.getByText(
          'Your dvc.yaml file should contain valid yaml before adding any pipeline stages.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('Show more commits', () => {
    it('should display a show more commits button if the table data hasMoreCommits is set to true', () => {
      renderTable({ ...tableDataFixture, hasMoreCommits: true })

      expect(screen.getByTestId('show-more-commits')).toBeInTheDocument()
    })

    it('should not display a show more commits button if the table data hasMoreCommits is set to false', () => {
      renderTable({ ...tableDataFixture, hasMoreCommits: false })

      expect(screen.queryByTestId('show-more-commits')).not.toBeInTheDocument()
    })

    it('should send a message to show more commits when the show more commits button is clicked', () => {
      renderTable({ ...tableDataFixture, hasMoreCommits: true })

      fireEvent.click(screen.getByTestId('show-more-commits'))

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        type: MessageFromWebviewType.SHOW_MORE_COMMITS
      })
    })
  })
})
