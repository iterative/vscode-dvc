/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import {
  act,
  createEvent,
  fireEvent,
  screen,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/base/tableData'
import sortedTableData from 'dvc/src/test/fixtures/expShow/sorted/tableData'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import {
  Column,
  ColumnType,
  Commit,
  Experiment,
  StudioLinkType
} from 'dvc/src/experiments/webview/contract'
import { buildMetricOrParamPath } from 'dvc/src/experiments/columns/paths'
import dataTypesTableFixture from 'dvc/src/test/fixtures/expShow/dataTypes/tableData'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { useIsFullyContained } from './overflowHoverTooltip/useIsFullyContained'
import styles from './table/styles.module.scss'
import { vsCodeApi } from '../../shared/api'
import {
  commonColumnFields,
  expectHeaders,
  getHeaders,
  tableData as simplifiedSortedTableDataFixture
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
  selectedRows,
  setTableData,
  renderTableWithFilters
} from '../../test/experimentsTable'
import { clearSelection, createWindowTextSelection } from '../../test/selection'
import { sendMessage } from '../../shared/vscode'
import { setExperimentsAsStarred } from '../../test/tableDataFixture'
import { collectColumnData } from '../state/tableDataSlice'

const tableStateFixture = {
  ...tableDataFixture,
  columnData: collectColumnData(tableDataFixture.columns)
}

const sortedTableStateFixture = {
  ...sortedTableData,
  columnData: collectColumnData(sortedTableData.columns)
}

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

  it('should show the no columns selected empty state when there are no columns provided and the table is sorted', () => {
    const { columns } = tableStateFixture
    const sortPath = columns[columns.length - 1].path
    renderTable({
      ...tableDataFixture,
      columns: [],
      sorts: [{ descending: true, path: sortPath }]
    })

    const noColumnsState = screen.queryByText('No Columns Selected.')
    expect(noColumnsState).toBeInTheDocument()
  })

  it('should not show the no columns selected empty state when only the timestamp column is provided', () => {
    renderTable({
      ...tableStateFixture,
      columns: tableStateFixture.columns.filter(
        ({ label }) => label === 'Created'
      )
    })

    const noColumnsState = screen.queryByText('No Columns Selected.')
    expect(noColumnsState).not.toBeInTheDocument()
  })

  it('should show a refresh button if there is a CLI error', () => {
    renderTable({
      ...tableStateFixture,
      cliError: 'Error'
    })

    const refreshButton = screen.queryByText('Refresh')
    expect(refreshButton).toBeInTheDocument()
    refreshButton && fireEvent.click(refreshButton)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.REFRESH_EXP_DATA
    })
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
      ...simplifiedSortedTableDataFixture,
      columns: [
        ...simplifiedSortedTableDataFixture.columns,
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

  describe('Sorted (Flattened) Table', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should add a "branch/tags" column', () => {
      renderTable(sortedTableStateFixture)

      const branchHeader = screen.getByTestId('header-branch')
      expect(branchHeader).toBeInTheDocument()

      const branchHeaderTextContent =
        within(branchHeader).getByText('Branch/Tags')
      expect(branchHeader).toBeInTheDocument()

      fireEvent.mouseEnter(branchHeaderTextContent, { bubbles: true })
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'The table has limited functionality while sorted. Clear all sorts to have nested rows and increase/decrease commits.'
      )

      const branchCell = screen.getByTestId('branch___main')
      expect(branchCell).toHaveTextContent('main')

      fireEvent.mouseLeave(branchHeaderTextContent, { bubbles: true })
      fireEvent.mouseEnter(within(branchCell).getByText('main'), {
        bubbles: true
      })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent('main')
    })

    it('should show two branches in the "branch/tags" column cell if the row belongs to two branches', () => {
      renderTable(sortedTableStateFixture)

      const cellBranches = within(
        screen.getByTestId('branch___other-branch')
      ).getAllByRole('listitem')

      expect(cellBranches[0]).toHaveTextContent('main')
      expect(cellBranches[1]).toHaveTextContent('other-branch')

      fireEvent.mouseEnter(cellBranches[0], { bubbles: true })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent('main, other-branch')
    })

    it('should show two branches plus the amount remaining in the "branch/tags" column cell if the row belongs to more than two branches', () => {
      renderTable(sortedTableStateFixture)

      const cellBranches = within(
        screen.getByTestId('branch___another-branch')
      ).getAllByRole('listitem')

      expect(cellBranches[0]).toHaveTextContent('main')
      expect(cellBranches[1]).toHaveTextContent('other-branch + 1 more')

      fireEvent.mouseEnter(cellBranches[0], { bubbles: true })

      advanceTimersByTime(NORMAL_TOOLTIP_DELAY[0])

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent('main, other-branch, another-branch')
    })

    it('should add a "parent" column', () => {
      renderTable(sortedTableStateFixture)

      const commitHeader = screen.getByTestId('header-commit')
      expect(commitHeader).toBeInTheDocument()

      const commitHeaderTextContent = within(commitHeader).getByText('Parent')
      expect(commitHeader).toBeInTheDocument()

      fireEvent.mouseEnter(commitHeaderTextContent, { bubbles: true })
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'The table has limited functionality while sorted. Clear all sorts to have nested rows and increase/decrease commits.'
      )

      expect(screen.getByTestId('commit___main').textContent).toStrictEqual('')
      expect(
        screen.getByTestId('commit___exp-83425').textContent
      ).toStrictEqual('53c3851')
    })
  })

  it('should be able to move columns to the start', async () => {
    renderTable({
      ...simplifiedSortedTableDataFixture,
      columnOrder: ['id', 'Created', 'params:A', 'params:B', 'params:C']
    })

    await expectHeaders(['A', 'B', 'C'])

    const moveBCtoStart = ['id', 'params:B', 'params:C', 'Created', 'params:A']

    setTableData({
      ...simplifiedSortedTableDataFixture,
      columnOrder: moveBCtoStart
    })

    expect(await getHeaders()).toStrictEqual([
      'Experiment',
      'B',
      'C',
      'Created',
      'A'
    ])
  })

  describe('Row expansion', () => {
    const experimentLabel = '4fb124a'

    it('should maintain expansion status when rows are reordered', () => {
      renderTable()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      setTableData({
        ...tableStateFixture,
        rows: [
          tableStateFixture.rows[0],
          {
            ...tableStateFixture.rows[1],
            subRows: [
              ...(tableStateFixture.rows[1].subRows as Experiment[])
            ].reverse()
          }
        ]
      })

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      contractRow('main')

      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()

      setTableData(tableStateFixture)

      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()
    })

    it('should maintain expansion status when the commit changes', () => {
      renderTable()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      expect(screen.getByText(experimentLabel)).toBeInTheDocument()

      contractRow('main')
      expect(screen.queryByText(experimentLabel)).not.toBeInTheDocument()

      const changedCommitName = 'changed-branch'

      const changedRows = [...tableStateFixture.rows]
      changedRows[1] = {
        ...changedRows[1],
        id: changedCommitName,
        label: changedCommitName,
        sha: '99999dfb4aa5fb41915610c3a256b418fc095610'
      }

      setTableData({
        ...tableStateFixture,
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
      const starredFixture = setExperimentsAsStarred(tableStateFixture, [
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
    it('should send a message to the extension to toggle an experiment when a plot icon is clicked', () => {
      renderTable()

      const testClick = (elementId: string, id: string) => {
        const element = within(getRow(elementId)).getByTestId('plot-icon')

        mockPostMessage.mockReset()

        fireEvent.click(element)

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          payload: id,
          type: MessageFromWebviewType.TOGGLE_EXPERIMENT
        })
      }

      testClick(EXPERIMENT_WORKSPACE_ID, EXPERIMENT_WORKSPACE_ID)
      testClick('[exp-83425]', 'exp-83425')
      testClick('main', 'main')
      testClick('[exp-e7a67]', 'exp-e7a67')
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

      expect(mockPostMessage).not.toHaveBeenCalledTimes(1)
      expect(mockPostMessage).not.toHaveBeenCalledWith({
        payload: testRowId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })
    })

    it('should not send a message if some other label is selected', () => {
      renderTable()
      mockPostMessage.mockClear()

      const selectedTestRowId = EXPERIMENT_WORKSPACE_ID
      const testRowId = 'main'

      createWindowTextSelection(selectedTestRowId, 5)
      fireEvent.click(screen.getAllByText(testRowId)[1])

      expect(mockPostMessage).not.toHaveBeenCalledTimes(1)
      expect(mockPostMessage).not.toHaveBeenCalledWith({
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
      ...tableStateFixture,
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
          parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
          path: testParamPath,
          pathArray: [ColumnType.PARAMS, 'params.yaml', testParamName],
          type: ColumnType.PARAMS,
          types: ['string']
        }
      ],
      rows: [
        {
          branch: 'main',
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
          branch: 'main',
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

      const plotIcon = within(getRow(EXPERIMENT_WORKSPACE_ID)).getByTestId(
        'row-action-plot'
      )
      fireEvent.mouseEnter(plotIcon)

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

      const starIcon = within(getRow('main')).getByTestId('row-action-star')
      fireEvent.mouseEnter(starIcon)

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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
      expect(menuitems).toHaveLength(11)
      expect(
        menuitems.filter(item => !item.className.includes('disabled'))
      ).toHaveLength(6)

      fireEvent.keyDown(paramsFileHeader, { bubbles: true, key: 'Escape' })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should not close when a disabled item is clicked', () => {
      renderTableWithoutRunningExperiments()

      const paramsFileHeader = screen.getByText('params.yaml')
      fireEvent.contextMenu(paramsFileHeader, { bubbles: true })

      advanceTimersByTime(100)

      const disabledMenuItem = screen
        .getAllByRole('menuitem')
        .find(item => item.className.includes('disabled'))

      expect(disabledMenuItem).toBeDefined()

      disabledMenuItem && fireEvent.click(disabledMenuItem, { bubbles: true })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(11)
    })

    it('should have the same enabled options in the empty placeholders', () => {
      renderTableWithPlaceholder()
      const header = screen.getByTestId('header-Created')
      const placeholders = screen.getAllByTestId(/header-Created.+placeholder/)
      const entireColumn = [header, ...placeholders]

      expect(entireColumn).toHaveLength(5)

      for (const segment of entireColumn) {
        fireEvent.contextMenu(segment, { bubbles: true })
        advanceTimersByTime(100)
        const menuitems = screen
          .getAllByRole('menuitem')
          .filter(item => !item.className.includes('disabled'))
          .map(item => item.textContent)

        expect(menuitems).toStrictEqual([
          'Hide',
          'Move to Start',
          'Set Max Header Height',
          'Select Columns',
          'Select First Columns',
          'Filter By',
          'Sort Ascending',
          'Sort Descending'
        ])

        fireEvent.keyDown(segment, { bubbles: true, key: 'Escape' })
      }
    })

    it('should have the same enabled options in the empty placeholders of the Experiment column', () => {
      renderTableWithPlaceholder()
      const header = screen.getByTestId('header-id')
      const placeholders = screen.getAllByTestId(/header-id.+placeholder/)
      const entireColumn = [header, ...placeholders]

      expect(entireColumn).toHaveLength(5)

      for (const segment of entireColumn) {
        fireEvent.contextMenu(segment, { bubbles: true })
        advanceTimersByTime(100)
        const menuitems = screen
          .getAllByRole('menuitem')
          .filter(item => !item.className.includes('disabled'))
          .map(item => item.textContent)

        expect(menuitems).toStrictEqual([
          'Set Max Header Height',
          'Select Columns',
          'Select First Columns'
        ])

        fireEvent.keyDown(segment, { bubbles: true, key: 'Escape' })
      }
    })

    it('should send the correct message when Move to Start is clicked', () => {
      renderTableWithPlaceholder()
      const placeholders = screen.getAllByTestId(/header-Created/)
      const placeholder = placeholders[0]
      fireEvent.contextMenu(placeholder, { bubbles: true })
      advanceTimersByTime(100)

      const moveOption = screen.getByText('Move to Start')

      mockPostMessage.mockClear()

      fireEvent.click(moveOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'Created',
        type: MessageFromWebviewType.EXPERIMENTS_TABLE_MOVE_TO_START
      })
    })

    it('should disable Filter By for placeholders and the stub column', () => {
      renderTable()

      mockPostMessage.mockClear()

      for (const headerText of ['params.yaml', 'Experiment']) {
        const column = screen.getByText(headerText)
        fireEvent.contextMenu(column, { bubbles: true })
        advanceTimersByTime(100)

        const filterOption = screen.getByText('Filter By')

        fireEvent.click(filterOption)
        fireEvent.keyDown(filterOption, { bubbles: true, key: 'Escape' })

        expect(mockPostMessage).not.toHaveBeenCalled()
      }
    })

    it('should disable Remove Filter(s) when there are no filters applied', () => {
      renderTable()

      mockPostMessage.mockClear()

      const column = screen.getByText('learning_rate')
      fireEvent.contextMenu(column, { bubbles: true })
      advanceTimersByTime(100)

      const filterOption = screen.getByText('Remove Filter(s)')

      fireEvent.click(filterOption)

      expect(mockPostMessage).not.toHaveBeenCalled()
    })

    it('should send the correct message when Filter By is clicked', () => {
      renderTable()
      const column = screen.getByText('learning_rate')
      fireEvent.contextMenu(column, { bubbles: true })
      advanceTimersByTime(100)

      const filterOption = screen.getByText('Filter By')

      mockPostMessage.mockClear()

      fireEvent.click(filterOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'params:params.yaml:learning_rate',
        type: MessageFromWebviewType.FILTER_COLUMN
      })
    })

    it('should send the correct message when Remove Filter(s) is clicked', () => {
      renderTableWithFilters()

      const column = screen.getByText('learning_rate')
      fireEvent.contextMenu(column, { bubbles: true })
      advanceTimersByTime(100)

      const filterOption = screen.getByText('Remove Filter(s)')

      mockPostMessage.mockClear()

      fireEvent.click(filterOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'params:params.yaml:learning_rate',
        type: MessageFromWebviewType.REMOVE_COLUMN_FILTERS
      })
    })

    it('should send the correct message when Select Columns is clicked', () => {
      renderTableWithPlaceholder()
      const placeholders = screen.getAllByTestId(/header-Created/)
      const placeholder = placeholders[0]
      fireEvent.contextMenu(placeholder, { bubbles: true })
      advanceTimersByTime(100)

      const selectOption = screen.getByText('Select Columns')

      mockPostMessage.mockClear()

      fireEvent.click(selectOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_COLUMNS
      })
    })

    it('should send the correct message when Select First Columns is clicked', () => {
      renderTableWithPlaceholder()
      const placeholders = screen.getAllByTestId(/header-Created/)
      const placeholder = placeholders[0]
      fireEvent.contextMenu(placeholder, { bubbles: true })
      advanceTimersByTime(100)

      const selectOption = screen.getByText('Select First Columns')

      mockPostMessage.mockClear()

      fireEvent.click(selectOption)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_FIRST_COLUMNS
      })
    })

    describe('Hiding a column from its empty placeholder', () => {
      it('should send the column id and not the placeholder id as the message payload', () => {
        renderTableWithPlaceholder()
        const placeholders = screen.getAllByTestId(
          /header-Created.+placeholder/
        )
        const placeholder = placeholders[0]
        fireEvent.contextMenu(placeholder, { bubbles: true })
        advanceTimersByTime(100)

        const hideOption = screen.getByText('Hide')

        mockPostMessage.mockClear()

        fireEvent.click(hideOption)

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          payload: 'Created',
          type: MessageFromWebviewType.EXPERIMENTS_TABLE_HIDE_COLUMN_PATH
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

    const getEnabledOptions = () => {
      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      return menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
    }

    it('should be available when there is data and no running experiments', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByTestId('workspace-row')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menu = screen.getByTestId('messages-menu')
      expect(menu).toBeDefined()
    })

    it('should enable the correct options for the workspace row with no checkpoints', () => {
      renderTableWithPlaceholder()

      const target = screen.getByTestId('workspace-row')
      fireEvent.contextMenu(target, { bubbles: true })

      expect(getEnabledOptions()).toStrictEqual([
        'Modify and Run',
        'Modify and Queue'
      ])
    })

    it('should enable the correct options for the workspace with checkpoints', () => {
      renderTableWithoutRunningExperiments()

      const [target] = screen.getAllByText(EXPERIMENT_WORKSPACE_ID)
      fireEvent.contextMenu(target, { bubbles: true })

      expect(getEnabledOptions()).toStrictEqual([
        'Modify and Run',
        'Modify and Resume',
        'Modify and Queue'
      ])
    })

    it('should enable the correct options for a commit with checkpoints', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getAllByText('main')[1]
      fireEvent.contextMenu(target, { bubbles: true })

      expect(getEnabledOptions()).toStrictEqual([
        'Apply to Workspace',
        'Create new Branch',
        'Copy Sha',
        'Star'
      ])
    })

    it('should enable the correct options for a commit without checkpoints', () => {
      renderTableWithoutRunningExperiments(false)

      const target = screen.getAllByText('main')[1]
      fireEvent.contextMenu(target, { bubbles: true })

      expect(getEnabledOptions()).toStrictEqual([
        'Apply to Workspace',
        'Create new Branch',
        'Copy Sha',
        'Star'
      ])
    })

    it('should enable the correct options for an experiment that is not running and close on esc', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('[exp-e7a67]')
      fireEvent.contextMenu(target, { bubbles: true })

      expect(getEnabledOptions()).toStrictEqual([
        'Apply to Workspace',
        'Create new Branch',
        'Copy Sha',
        'Copy Experiment Name',
        'Push',
        'Star',
        'Remove'
      ])

      fireEvent.keyDown(screen.getAllByRole('menuitem')[0], {
        bubbles: true,
        key: 'Escape'
      })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should enable the correct options for a running experiment', () => {
      renderTable()

      const target = screen.getByText('[exp-e7a67]')
      fireEvent.contextMenu(target, { bubbles: true })

      expect(getEnabledOptions()).toStrictEqual([
        'Show Logs',
        'Copy Sha',
        'Copy Experiment Name',
        'Star',
        'Stop'
      ])

      fireEvent.click(screen.getAllByRole('menuitem')[0], {
        bubbles: true,
        key: 'Escape'
      })
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'exp-e7a67',
        type: MessageFromWebviewType.SHOW_EXPERIMENT_LOGS
      })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should not close when a disabled item is clicked', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getAllByText('main')[1]
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)

      const disabledMenuItem = screen
        .getAllByRole('menuitem')
        .find(item => item.className.includes('disabled'))

      expect(disabledMenuItem).toBeDefined()

      disabledMenuItem && fireEvent.click(disabledMenuItem, { bubbles: true })
      expect(screen.queryAllByRole('menuitem')).toHaveLength(13)
    })

    it('should be removed with a left click', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.getAllByRole('menuitem')).toHaveLength(13)

      fireEvent.click(row, {
        bubbles: true
      })
      advanceTimersByTime(100)

      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    })

    it('should be removed with a left click on a different row', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.getAllByRole('menuitem')).toHaveLength(13)

      const commit = getRow('main')
      fireEvent.click(commit, { bubbles: true })
      advanceTimersByTime(100)
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    })

    it('should be moved with a right click on the same row (not toggle)', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(13)

      fireEvent.contextMenu(within(row).getByText('[exp-e7a67]'), {
        bubbles: true
      })
      advanceTimersByTime(200)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(13)
    })

    it('should enable the remove option for an experiment', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Remove')
    })

    it('should enable the remove option if only experiments are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Remove Selected')

      const removeOption = menuitems.find(
        item => item.textContent?.includes('Remove Selected')
      )

      expect(removeOption).toBeDefined()

      removeOption && fireEvent.click(removeOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'test-branch'],
        type: MessageFromWebviewType.REMOVE_EXPERIMENT
      })
    })

    it('should disable the remove selected option if an experiment is running in the workspace', () => {
      renderTable()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).not.toContain('Remove Selected')
    })

    it('should enable the push option if only experiments are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Push Selected')

      const pushOption = menuitems.find(
        item => item.textContent?.includes('Push Selected')
      )

      expect(pushOption).toBeDefined()

      pushOption && fireEvent.click(pushOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'test-branch'],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })
    })

    it('should disable the push selected option if an experiment is running in the workspace', () => {
      renderTable()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).not.toContain('Push Selected')
    })

    it('should enable the stop option if only running experiments are selected', () => {
      renderTable()

      clickRowCheckbox('4fb124a')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Stop')

      const stopOption = menuitems.find(
        item => item.textContent?.includes('Stop')
      )

      expect(stopOption).toBeDefined()

      stopOption && fireEvent.click(stopOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67'],
        type: MessageFromWebviewType.STOP_EXPERIMENTS
      })
    })

    it('should enable the stop option if multiple running experiments are selected', () => {
      renderTable()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('[exp-83425]')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Stop')

      const stopOption = menuitems.find(
        item => item.textContent?.includes('Stop')
      )

      expect(stopOption).toBeDefined()

      stopOption && fireEvent.click(stopOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67', 'exp-83425'],
        type: MessageFromWebviewType.STOP_EXPERIMENTS
      })
    })

    it('should disable the stop option if finished experiments are selected', () => {
      renderTable()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('90aea7f')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).not.toContain('Stop')
    })

    it('should enable the user to stop an experiment running in the workspace', () => {
      renderTable()

      const [target] = screen.getAllByText(EXPERIMENT_WORKSPACE_ID)
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Stop')

      const stopOption = menuitems.find(
        item => item.textContent?.includes('Stop')
      )

      expect(stopOption).toBeDefined()

      stopOption && fireEvent.click(stopOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: [EXPERIMENT_WORKSPACE_ID],
        type: MessageFromWebviewType.STOP_EXPERIMENTS
      })
    })

    it('should enable the user to share an experiment', () => {
      renderTableWithoutRunningExperiments()

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Push')

      const shareOption = menuitems.find(
        item => item.textContent?.includes('Push')
      )

      expect(shareOption).toBeDefined()

      shareOption && fireEvent.click(shareOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: ['exp-e7a67'],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })
    })

    it('should not enable the user to share a running experiment', () => {
      renderTable()

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).not.toContain('Push')
    })

    it('should not enable the user to share an experiment whilst one is running in the workspace', () => {
      renderTable()

      const target = screen.getByText('42b8736')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).not.toContain('Push')
    })

    it('should always enable the Plots options if multiple rows are selected', () => {
      renderTableWithoutRunningExperiments()

      clickRowCheckbox('4fb124a')
      clickRowCheckbox('42b8736')

      const target = screen.getByText('4fb124a')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
      expect(itemLabels).toContain('Plot and Show')
      expect(itemLabels).toContain('Plot')

      const plotOption = menuitems.find(
        item => item.textContent?.includes('Plot and Show')
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
      const itemLabels = menuitems
        .filter(item => !item.className.includes('disabled'))
        .map(item => item.textContent)
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

      const clearOption = menuitems.find(
        item => item.textContent?.includes('Clear')
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

    it("should allow the user to copy an experiment's Studio link", () => {
      renderTable()

      const target = screen.getByText('42b8736')
      fireEvent.contextMenu(target, { bubbles: true })

      advanceTimersByTime(100)
      const menuitems = screen.getAllByRole('menuitem')

      const copyLinkOption = menuitems.find(
        item =>
          item.textContent?.includes('Copy Studio Link') &&
          !item.className.includes('disabled')
      )

      expect(copyLinkOption).toBeDefined()

      copyLinkOption && fireEvent.click(copyLinkOption)

      expect(sendMessage).toHaveBeenCalledWith({
        payload: { id: 'test-branch', type: StudioLinkType.PUSHED },
        type: MessageFromWebviewType.COPY_STUDIO_LINK
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

  describe('Header Indicators', () => {
    it('should show a show only changed columns indicator', () => {
      renderTable()
      jest.useFakeTimers()

      const showOnlyChangedIndicator = screen.getByLabelText(
        'show only changed columns'
      )

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(showOnlyChangedIndicator)
      advanceTimersByTime(1000)
      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('Toggle Show Only Changed Columns')
    })

    it('should show an indicator with the amount of experiments selected for plotting', () => {
      renderTable({
        ...tableStateFixture
      })
      jest.useFakeTimers()
      const selectedForPlotsIndicator =
        screen.getByLabelText('selected for plots')
      expect(selectedForPlotsIndicator).toHaveTextContent('2')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(selectedForPlotsIndicator)
      advanceTimersByTime(1000)
      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('Show Plots')

      setTableData({
        ...tableStateFixture,
        rows: [
          { ...tableStateFixture.rows[0], selected: false },
          { ...tableStateFixture.rows[1], selected: false, subRows: [] }
        ],
        selectedForPlotsCount: 0
      })

      expect(selectedForPlotsIndicator).toHaveTextContent('')

      setTableData({
        ...tableStateFixture,
        rows: [
          { ...tableStateFixture.rows[0], selected: false },
          {
            ...tableStateFixture.rows[1],
            selected: false,
            subRows: [
              {
                ...(tableStateFixture.rows[1]?.subRows?.[0] as Commit),
                selected: true
              }
            ]
          }
        ],
        selectedForPlotsCount: 1
      })

      expect(selectedForPlotsIndicator).toHaveTextContent('1')
      jest.useRealTimers()
    })

    it('should not change the plotted indicator when plotted experiments are hidden', () => {
      const plottedExperiment = '4fb124a'

      renderTable({
        ...tableStateFixture
      })

      expect(screen.getByText(plottedExperiment)).toBeInTheDocument()

      expect(screen.getByLabelText('selected for plots')).toHaveTextContent('2')

      contractRow('main')

      expect(screen.getByLabelText('selected for plots')).toHaveTextContent('2')
    })

    it('should show an indicator with the amount of applied sorts', () => {
      renderTable({
        ...tableStateFixture,
        sorts: []
      })
      jest.useFakeTimers()
      const sortIndicator = screen.getByLabelText('sorts')
      expect(sortIndicator).toHaveTextContent('')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(sortIndicator)
      advanceTimersByTime(1000)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('Show Sorts')

      const { columns } = tableStateFixture
      const firstSortPath = columns[columns.length - 1].path
      const secondSortPath = columns[columns.length - 2].path
      setTableData({
        ...tableStateFixture,
        sorts: [{ descending: true, path: firstSortPath }]
      })
      expect(sortIndicator).toHaveTextContent('1')
      setTableData({
        ...tableStateFixture,
        sorts: [
          { descending: true, path: firstSortPath },
          { descending: false, path: secondSortPath }
        ]
      })
      expect(sortIndicator).toHaveTextContent('2')
      jest.useRealTimers()
    })

    it('should show an indicator with the amount of applied filters', () => {
      renderTable({
        ...tableStateFixture,
        filters: []
      })
      jest.useFakeTimers()
      const filterIndicator = screen.getByLabelText('filters')
      expect(filterIndicator).toHaveTextContent('')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(filterIndicator)
      advanceTimersByTime(1000)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('Show Filters')

      const { columns } = tableStateFixture
      const firstFilterPath = columns[columns.length - 1].path
      const secondFilterPath = columns[columns.length - 2].path
      setTableData({
        ...tableStateFixture,
        filters: [firstFilterPath]
      })
      expect(filterIndicator).toHaveTextContent('1')

      setTableData({
        ...tableStateFixture,
        filters: [firstFilterPath, secondFilterPath]
      })
      expect(filterIndicator).toHaveTextContent('2')

      setTableData({
        ...tableStateFixture,
        filters: [firstFilterPath, secondFilterPath]
      })
      expect(filterIndicator).toHaveTextContent('2')

      setTableData({
        ...tableStateFixture,
        filters: []
      })
      expect(filterIndicator).toHaveTextContent('')
      expect(tooltip).not.toHaveTextContent('Experiment')
      jest.useRealTimers()
    })

    it('should show a tooltip for the branches indicator', () => {
      renderTable({
        ...tableStateFixture
      })
      jest.useFakeTimers()
      const branchesIndicator = screen.getByLabelText('branches')
      expect(branchesIndicator).toHaveTextContent('')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(branchesIndicator)
      advanceTimersByTime(1000)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('Select Branches')
      jest.useRealTimers()
    })

    it('should show an indicator for the number of branches selected', () => {
      const branches = ['main', 'other', 'third']

      let workspace
      const rowsWithoutWorkspace = []
      for (const row of tableStateFixture.rows) {
        if (row.id !== EXPERIMENT_WORKSPACE_ID) {
          rowsWithoutWorkspace.push(row)
          continue
        }
        workspace = row
      }

      const multipleBranches = {
        ...tableStateFixture,
        hasData: true,
        rows: [
          workspace as Commit,
          ...rowsWithoutWorkspace.map(row => ({
            ...row,
            branch: branches[0],
            subRows: undefined
          })),
          ...rowsWithoutWorkspace.map(row => ({
            ...row,
            branch: branches[1],
            subRows: undefined
          })),
          ...rowsWithoutWorkspace.map(row => ({
            ...row,
            branch: branches[2],
            subRows: undefined
          }))
        ],
        selectedBranches: branches.slice(1)
      }

      renderTable(multipleBranches)

      const [indicator] = screen.getAllByLabelText('branches')

      expect(indicator).toHaveTextContent(`${branches.length - 1}`)
    })

    it('should send a message to toggle show only changed columns when the show only changed columns indicator is clicked', () => {
      renderTable()
      mockPostMessage.mockClear()
      fireEvent.click(screen.getByLabelText('show only changed columns'))
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.TOGGLE_SHOW_ONLY_CHANGED
      })
    })

    it('should send a message to focus the relevant tree/view when clicked', () => {
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

    it('should show an indicator with the amount of displayed columns', () => {
      renderTable({
        ...tableStateFixture
      })
      jest.useFakeTimers()
      const columnsIndicator = screen.getByLabelText('columns')
      expect(columnsIndicator).toHaveTextContent('22')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(columnsIndicator)
      advanceTimersByTime(1000)
      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent('Select Columns')

      setTableData({
        ...tableStateFixture,
        columns: tableStateFixture.columns.slice(1)
      })

      expect(columnsIndicator).toHaveTextContent('21')

      setTableData({
        ...tableStateFixture,
        columns: []
      })

      expect(columnsIndicator).toHaveTextContent('')

      jest.useRealTimers()
    })

    it('should send a message to select columns when the select columns icon is clicked', () => {
      renderTable()
      mockPostMessage.mockClear()
      fireEvent.click(screen.getByLabelText('columns'))
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_COLUMNS
      })
    })
  })

  it('should disable text selection while resizing', async () => {
    renderTable()

    expect(document.body).not.toHaveClass(styles.isColumnResizing)

    const [experimentColumnResizeHandle] =
      await screen.findAllByRole('separator')

    fireEvent.mouseDown(experimentColumnResizeHandle)

    expect(document.body).toHaveClass(styles.isColumnResizing)

    fireEvent.mouseUp(experimentColumnResizeHandle)

    expect(document.body).not.toHaveClass(styles.isColumnResizing)
  })

  describe('Add configuration button', () => {
    it('should show a add config button if the project has no pipeline stages', () => {
      renderTable()
      setTableData({ ...tableStateFixture, hasConfig: false })

      expect(screen.getByText('Add dvc.yaml')).toBeInTheDocument()
    })

    it('should not show a add config button if the project has pipeline stages', () => {
      renderTable()

      expect(screen.queryByText('Add dvc.yaml')).not.toBeInTheDocument()
    })

    it('should send a message to the extension to add a pipeline stage when clicking on the add config button', () => {
      renderTable()
      setTableData({ ...tableStateFixture, hasConfig: false })

      fireEvent.click(screen.getByText('Add dvc.yaml'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.ADD_CONFIGURATION
      })
    })
  })

  describe('Change number of commits', () => {
    it('should display a show more commits button', () => {
      renderTable({ ...tableStateFixture, hasMoreCommits: { main: true } })

      expect(screen.getByLabelText('Show More Commits')).toBeInTheDocument()
    })

    it('should send a message to show more commits when the show more commits button is clicked', () => {
      renderTable({ ...tableStateFixture, hasMoreCommits: { main: true } })

      fireEvent.click(screen.getByLabelText('Show More Commits'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.SHOW_MORE_COMMITS
      })
    })

    it('should disable the show more commits button if the table data hasMoreCommits is set to false', () => {
      renderTable({ ...tableStateFixture, hasMoreCommits: { main: false } })

      fireEvent.click(screen.getByLabelText('Show More Commits'))

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.SHOW_MORE_COMMITS
      })
    })

    it('should display a show less commits button', () => {
      renderTable({
        ...tableStateFixture,
        isShowingMoreCommits: { main: true }
      })

      expect(screen.getByLabelText('Show Less Commits')).toBeInTheDocument()
    })

    it('should send a message to show less commits when the show less commits button is clicked', () => {
      renderTable({
        ...tableStateFixture,
        isShowingMoreCommits: { main: true }
      })

      fireEvent.click(screen.getByLabelText('Show Less Commits'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.SHOW_LESS_COMMITS
      })
    })

    it('should disable the show less commits button if the table data isShowingMoreCommits is set to false', () => {
      renderTable({
        ...tableStateFixture,
        isShowingMoreCommits: { main: false }
      })

      fireEvent.click(screen.getByLabelText('Show Less Commits'))

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.SHOW_LESS_COMMITS
      })
    })

    it('should display a reset commits button', () => {
      renderTable({ ...tableStateFixture, hasMoreCommits: { main: true } })

      expect(
        screen.getByLabelText('Reset Commits to Default')
      ).toBeInTheDocument()
    })

    it('should send a message to reset commits when the reset commits button is clicked', () => {
      renderTable()

      fireEvent.click(screen.getByLabelText('Reset Commits to Default'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.RESET_COMMITS
      })
    })
  })

  describe('Add / Remove branches', () => {
    it('should send a message to select branches when clicking the select branches button', () => {
      renderTable()

      fireEvent.click(screen.getByLabelText('branches'))

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_BRANCHES
      })
    })

    it('should disable the select branches button if there are no branches to select', () => {
      renderTable({ ...tableStateFixture, hasBranchesToSelect: false })

      fireEvent.click(screen.getByLabelText('branches'))

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_BRANCHES
      })
    })
  })

  describe('Experiment git remote status indicator', () => {
    it('should not allow pushing an experiment when an experiment is running in the workspace', () => {
      renderTable()

      const pushButton = within(getRow('f0f9186')).getByLabelText(
        'Push Experiment'
      )
      fireEvent.click(pushButton)

      expect(mockPostMessage).not.toHaveBeenCalledWith({
        payload: ['exp-f13bca'],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })
    })

    it('should allow pushing an experiment when an experiment is not running in the workspace', () => {
      renderTableWithoutRunningExperiments()

      const pushButton = within(getRow('f0f9186')).getByLabelText(
        'Push Experiment'
      )
      fireEvent.click(pushButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: ['exp-f13bca'],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })
    })

    it('should allow copying a Studio link when an experiment exists on the remote and Studio', () => {
      renderTable()

      const copyLinkButton = within(getRow('42b8736')).getByLabelText(
        'Copy Experiment Link'
      )
      fireEvent.click(copyLinkButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: { id: 'test-branch', type: StudioLinkType.PUSHED },
        type: MessageFromWebviewType.COPY_STUDIO_LINK
      })
    })

    it('should not allow copying a Studio link when an experiment exists on the remote but not on Studio', () => {
      renderTable({
        ...tableStateFixture,
        rows: tableDataFixture.rows.map(row => ({
          ...row,
          subRows: row.subRows?.map(exp => ({
            ...exp,
            studioLinkType: undefined
          }))
        }))
      })

      expect(
        within(getRow('42b8736')).queryByLabelText('Copy Experiment Link')
      ).not.toBeInTheDocument()
    })

    it('should not allow copying a Studio link when an experiment does not exist on the remote or Studio', () => {
      renderTable()

      expect(
        within(getRow('f0f9186')).queryByLabelText('Copy Experiment Link')
      ).not.toBeInTheDocument()
    })
  })
})
