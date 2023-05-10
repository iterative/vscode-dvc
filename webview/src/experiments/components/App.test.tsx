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
import {
  Column,
  ColumnType,
  Commit,
  Experiment
} from 'dvc/src/experiments/webview/contract'
import { buildMetricOrParamPath } from 'dvc/src/experiments/columns/paths'
import dataTypesTableFixture from 'dvc/src/test/fixtures/expShow/dataTypes/tableData'
import { EXPERIMENT_WORKSPACE_ID, Executor } from 'dvc/src/cli/dvc/contract'
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
import { setExperimentsAsStarred } from '../../test/tableDataFixture'
import { featureFlag } from '../../util/flags'

jest.mock('../../shared/api')
jest.mock('../../util/styles')
jest.mock('./overflowHoverTooltip/useIsFullyContained', () => ({
  useIsFullyContained: jest.fn()
}))
const mockedFeatureFlags = jest.mocked(featureFlag)
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

  describe('Row expansion', () => {
    const experimentLabel = '4fb124a'

    it('should maintain expansion status when rows are reordered', () => {
      renderTable()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      setTableData({
        ...tableDataFixture,
        rows: [
          tableDataFixture.rows[0],
          {
            ...tableDataFixture.rows[1],
            subRows: [
              ...(tableDataFixture.rows[1].subRows as Experiment[])
            ].reverse()
          }
        ]
      })

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      contractRow('main')

      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()

      setTableData(tableDataFixture)

      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()
    })

    it('should maintain expansion status when the commit changes', () => {
      renderTable()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      contractRow('main')
      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()

      const changedCommitName = 'changed-branch'

      const changedRows = [...tableDataFixture.rows]
      changedRows[1] = {
        ...changedRows[1],
        id: changedCommitName,
        label: changedCommitName,
        sha: '99999dfb4aa5fb41915610c3a256b418fc095610'
      }

      setTableData({
        ...tableDataFixture,
        rows: changedRows
      })

      expect(screen.getByText(changedCommitName)).toBeInTheDocument()
      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()
    })

    it('should not toggle a commit when using the row expansion button', () => {
      renderTable()
      const testRow = getRow('main')
      const expandButton = within(testRow).getByTitle('Contract Row')

      mockPostMessage.mockClear()

      fireEvent.click(expandButton)
      expect(mockPostMessage).not.toHaveBeenCalled()

      expandRow('main')

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
    const testRowLabel = 'main'

    const getMiddleStatesTestRow = () => {
      return getRow(testRowLabel)
    }

    const selectSomeSubRows = () => {
      clickRowCheckbox('489fd8b')
      clickRowCheckbox('4fb124a')

      return 2
    }

    const starSomeSubRows = () => {
      const starredFixture = setExperimentsAsStarred(tableDataFixture, [
        '489fd8b',
        '4fb124a'
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
        const numberOfSubRowsSelected = selectSomeSubRows()
        expect(getCheckboxCountIndicator(row)).not.toBeInTheDocument()
        contractRow(testRowLabel)
        const collapsed = getMiddleStatesTestRow()
        expect(getCheckboxCountIndicator(collapsed)).toHaveTextContent(
          `${numberOfSubRowsSelected}`
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
        const numberOfSubRowsStarred = starSomeSubRows()
        expect(
          getCountIndicatorById(row, 'row-action-star')
        ).not.toBeInTheDocument()
        contractRow(testRowLabel)
        const collapsed = getMiddleStatesTestRow()
        expect(
          getCountIndicatorById(collapsed, 'row-action-star')
        ).toHaveTextContent(`${numberOfSubRowsStarred}`)
      })
    })
  })

  describe('Toggle experiment status', () => {
    it('should send a message to the extension to toggle an experiment when the row is clicked', () => {
      renderTable()

      const testClick = (element: HTMLElement, id: string) => {
        mockPostMessage.mockReset()

        fireEvent.click(element)

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          payload: id,
          type: MessageFromWebviewType.TOGGLE_EXPERIMENT
        })
      }

      const [workspace, experimentRunningInWorkspace] = screen.getAllByText(
        EXPERIMENT_WORKSPACE_ID
      )

      testClick(workspace, EXPERIMENT_WORKSPACE_ID)
      testClick(experimentRunningInWorkspace, 'exp-83425')
      testClick(screen.getByText('main'), 'main')
      testClick(screen.getByText('[exp-e7a67]'), 'exp-e7a67')
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
      const getWorkspace = () => screen.getAllByText(testRowId)[0]

      createWindowTextSelection(testRowId, 5)
      fireEvent.click(getWorkspace())

      expect(mockPostMessage).not.toHaveBeenCalledTimes(1)
      expect(mockPostMessage).not.toHaveBeenCalledWith({
        payload: testRowId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      mockPostMessage.mockClear()

      clearSelection()
      fireEvent.click(getWorkspace())

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
          branch: 'current',
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
          branch: 'current',
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
        'Push',
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
      expect(screen.getAllByRole('menuitem')).toHaveLength(10)

      fireEvent.click(window, { bubbles: true })
      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should be removed with a left click on a different row', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.getAllByRole('menuitem')).toHaveLength(10)

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
      expect(screen.queryAllByRole('menuitem')).toHaveLength(10)

      fireEvent.contextMenu(within(row).getByText('[exp-e7a67]'), {
        bubbles: true
      })
      advanceTimersByTime(200)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(10)
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

    it('should present the remove option if only experiments are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Remove Selected')

      const removeOption = menuitems.find(item =>
        item.textContent?.includes('Remove Selected')
      )

      expect(removeOption).toBeDefined()

      removeOption && fireEvent.click(removeOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'test-branch'],
        type: MessageFromWebviewType.REMOVE_EXPERIMENT
      })
    })

    it('should present the push option if only experiments are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Push Selected')

      const pushOption = menuitems.find(item =>
        item.textContent?.includes('Push Selected')
      )

      expect(pushOption).toBeDefined()

      pushOption && fireEvent.click(pushOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'test-branch'],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
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
        payload: [{ executor: Executor.DVC_TASK, id: 'exp-e7a67' }],
        type: MessageFromWebviewType.STOP_EXPERIMENT
      })
    })

    it('should enable the user to stop an experiment running in the workspace', () => {
      renderTable()

      const [target] = screen.getAllByText(EXPERIMENT_WORKSPACE_ID)
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
          { executor: Executor.WORKSPACE, id: EXPERIMENT_WORKSPACE_ID }
        ],
        type: MessageFromWebviewType.STOP_EXPERIMENT
      })
    })

    it('should enable the user to share an experiment', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems.map(item => item.textContent)
      expect(itemLabels).toContain('Push')

      const shareOption = menuitems.find(item =>
        item.textContent?.includes('Push')
      )

      expect(shareOption).toBeDefined()

      shareOption && fireEvent.click(shareOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67'],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })
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
      clickRowCheckbox('489fd8b', true)

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

      clickRowCheckbox('489fd8b')
      clickRowCheckbox('4fb124a', true)

      expect(selectedRows()).toHaveLength(4)
    })

    it('should present the Clear selected rows option when multiple rows are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('489fd8b', true)

      expect(selectedRows().length).toBe(4)

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)

      const menuitems = screen.getAllByRole('menuitem')

      const clearOption = menuitems.find(item =>
        item.textContent?.includes('Clear')
      )
      clearOption && fireEvent.click(clearOption)

      advanceTimersByTime(100)
      expect(selectedRows().length).toBe(0)
    })

    it('should clear the row selection when the Escape key is pressed', () => {
      renderTable()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('489fd8b', true)

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
        ],
        selectedForPlotsCount: 0
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
                ...(tableDataFixture.rows[1]?.subRows?.[0] as Commit),
                selected: true
              }
            ]
          }
        ],
        selectedForPlotsCount: 1
      })

      expect(selectedForPlotsIndicator).toHaveTextContent('1')
      expect(tooltip).toHaveTextContent(
        '1 Experiment Selected for Plotting (Max 7)'
      )
    })

    it('should show not change the plotted indicator when plotted experiments are hidden', () => {
      const plottedExperiment = '4fb124a'

      renderTable({
        ...tableDataFixture
      })

      expect(screen.getByText(plottedExperiment)).toBeInTheDocument()

      const selectedForPlotsIndicator =
        screen.getByLabelText('selected for plots')
      expect(selectedForPlotsIndicator).toHaveTextContent('2')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(selectedForPlotsIndicator)

      const expandedTooltip = screen.getByRole('tooltip')

      expect(expandedTooltip).toHaveTextContent(
        '2 Experiments Selected for Plotting (Max 7)'
      )

      fireEvent.mouseLeave(selectedForPlotsIndicator)

      contractRow('main')

      expect(screen.queryByText(plottedExperiment)).not.toBeInTheDocument()
      fireEvent.mouseEnter(selectedForPlotsIndicator)

      const contractedTooltip = screen.getByRole('tooltip')

      expect(contractedTooltip).toHaveTextContent(
        '2 Experiments Selected for Plotting (Max 7)'
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
    expect(tooltip).toHaveTextContent('No Experiments Filtered')

    setTableData({
      ...tableDataFixture,
      filteredCount: 1,
      filters: [firstFilterPath, secondFilterPath]
    })
    expect(filterIndicator).toHaveTextContent('2')
    expect(tooltip).toHaveTextContent('2 Filters Applied')
    expect(tooltip).toHaveTextContent('1 Experiment Filtered')

    setTableData({
      ...tableDataFixture,
      filteredCount: 10000,
      filters: [firstFilterPath, secondFilterPath]
    })
    expect(filterIndicator).toHaveTextContent('2')
    expect(tooltip).toHaveTextContent('10000 Experiments Filtered')

    setTableData({
      ...tableDataFixture,
      filteredCount: 10000,
      filters: []
    })
    expect(filterIndicator).toHaveTextContent('')
    expect(tooltip).not.toHaveTextContent('Experiment')
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
      renderTable({ ...tableDataFixture, hasMoreCommits: { current: true } })

      expect(screen.getByText('Show More Commits')).toBeInTheDocument()
    })

    it('should not display a show more commits button if the table data hasMoreCommits is set to false', () => {
      renderTable({ ...tableDataFixture, hasMoreCommits: { current: false } })

      expect(screen.queryByText('Show More Commits')).not.toBeInTheDocument()
    })

    it('should send a message to show more commits when the show more commits button is clicked', () => {
      renderTable({ ...tableDataFixture, hasMoreCommits: { current: true } })

      fireEvent.click(screen.getByText('Show More Commits'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'current',
        type: MessageFromWebviewType.SHOW_MORE_COMMITS
      })
    })

    it('should display a show less commits button if the table data isShowingMoreCommits is set to true', () => {
      renderTable({
        ...tableDataFixture,
        isShowingMoreCommits: { current: true }
      })

      expect(screen.getByText('Show Less Commits')).toBeInTheDocument()
    })

    it('should not display a show less commits button if the table data isShowingMoreCommits is set to false', () => {
      renderTable({
        ...tableDataFixture,
        isShowingMoreCommits: { current: false }
      })

      expect(screen.queryByText('Show Less Commits')).not.toBeInTheDocument()
    })

    it('should send a message to show less commits when the show less commits button is clicked', () => {
      renderTable({
        ...tableDataFixture,
        isShowingMoreCommits: { current: true }
      })

      fireEvent.click(screen.getByText('Show Less Commits'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'current',
        type: MessageFromWebviewType.SHOW_LESS_COMMITS
      })
    })

    it('should show a button to switch to branches view if isBranchesView is set to false', () => {
      renderTable({ ...tableDataFixture, isBranchesView: false })

      expect(
        screen.getByText('Switch to All Branches View')
      ).toBeInTheDocument()
    })

    it('should not show a button to switch to branches view if isBranchesView is set to true', () => {
      renderTable({ ...tableDataFixture, isBranchesView: true })

      expect(
        screen.queryByText('Switch to All Branches View')
      ).not.toBeInTheDocument()
    })

    it('should send a message to switch to branches view when clicking the switch to branches view button', () => {
      renderTable({ ...tableDataFixture, isBranchesView: false })

      fireEvent.click(screen.getByText('Switch to All Branches View'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SWITCH_BRANCHES_VIEW
      })
    })

    it('should show a button to switch to commits view if isBranchesView is set to true', () => {
      renderTable({ ...tableDataFixture, isBranchesView: true })

      expect(screen.getByText('Switch to Commits View')).toBeInTheDocument()
    })

    it('should not show a button to switch to commits view if isBranchesView is set to false', () => {
      renderTable({ ...tableDataFixture, isBranchesView: false })

      expect(
        screen.queryByText('Switch to Commits View')
      ).not.toBeInTheDocument()
    })

    it('should send a message to switch to commits view when clicking the switch to commits view button', () => {
      renderTable({ ...tableDataFixture, isBranchesView: true })

      fireEvent.click(screen.getByText('Switch to Commits View'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SWITCH_COMMITS_VIEW
      })
    })

    it('should disable the show more and show less commits buttons when isBranchView is set to true', () => {
      renderTable({ ...tableDataFixture, isBranchesView: true })

      expect(screen.getByText('Show More Commits')).toHaveProperty(
        'disabled',
        true
      )
      expect(screen.getByText('Show Less Commits')).toHaveProperty(
        'disabled',
        true
      )
    })

    it('should not disable the show more and show less commits buttons when isBranchView is set to false', () => {
      renderTable({ ...tableDataFixture, isBranchesView: false })

      expect(screen.getByText('Show More Commits')).toHaveProperty(
        'disabled',
        false
      )
      expect(screen.getByText('Show Less Commits')).toHaveProperty(
        'disabled',
        false
      )
    })
  })

  describe('Add / Remove branches', () => {
    beforeEach(() => {
      mockedFeatureFlags.ADD_REMOVE_BRANCHES = true
    })

    it('should send a message to select branches when clicking the select branches button', () => {
      renderTable()

      fireEvent.click(screen.getByText('Select Branch(es) to Show'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_BRANCHES
      })
    })

    it('should disable the select branches button if there are no branches to select', () => {
      renderTable({ ...tableDataFixture, hasBranchesToSelect: false })

      fireEvent.click(screen.getByText('Select Branch(es) to Show'))

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_BRANCHES
      })
    })
  })

  describe('Feature flags', () => {
    it('should not show the add/remove branches buttons if the feature flag is off', () => {
      mockedFeatureFlags.ADD_REMOVE_BRANCHES = false

      renderTable()

      expect(
        screen.queryByText('Select Branch(es) to Show')
      ).not.toBeInTheDocument()
    })

    it('should show the add/remove branches buttons if the feature flag is on', () => {
      mockedFeatureFlags.ADD_REMOVE_BRANCHES = true

      renderTable()

      expect(screen.getByText('Select Branch(es) to Show')).toBeInTheDocument()
    })
  })
})
