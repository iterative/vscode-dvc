/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/base/tableData'
import { Row } from 'dvc/src/experiments/webview/contract'
import { vsCodeApi } from '../../shared/api'
import { getRow } from '../../test/queries'
import {
  advanceTimersByTime,
  clickRowCheckbox,
  contractRow,
  expandRow,
  renderTable,
  renderTableWithoutRunningExperiments,
  renderTableWithPlaceholder,
  selectedRows,
  setTableData
} from '../../test/experimentsTable'

jest.mock('../../shared/api')
jest.mock('../../util/styles')
jest.mock('./overflowHoverTooltip/useIsFullyContained', () => ({
  useIsFullyContained: jest.fn()
}))

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('Experiments', () => {
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

    it('should maintain expansion status when the branch changes', () => {
      renderTable()

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

      setTableData({
        ...tableDataFixture,
        rows: changedRows
      })

      expect(screen.getByText(changedBranchName)).toBeInTheDocument()
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
        'Modify, Reset and Run',
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
        'Apply to Workspace',
        'Create new Branch',
        'Commit and Share',
        'Share as Branch',
        'Modify, Reset and Run',
        'Modify and Resume',
        'Modify and Queue',
        'Star',
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
      expect(screen.getAllByRole('menuitem')).toHaveLength(9)

      fireEvent.click(window, { bubbles: true })
      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should be removed with a left click on a different row', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.getAllByRole('menuitem')).toHaveLength(9)

      const branch = getRow('main')
      fireEvent.click(branch, { bubbles: true })
      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    })

    it('should be moved with a right click on the same row (not toggle)', () => {
      renderTableWithoutRunningExperiments()

      const row = getRow('4fb124a')
      fireEvent.contextMenu(row, { bubbles: true })

      advanceTimersByTime(100)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(9)

      fireEvent.contextMenu(within(row).getByText('[exp-e7a67]'), {
        bubbles: true
      })
      advanceTimersByTime(200)
      expect(screen.queryAllByRole('menuitem')).toHaveLength(9)
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

  describe('Header Indicators', () => {
    it('should show an indicator with the amount of experiments selected for plotting', () => {
      renderTable({
        ...tableDataFixture
      })
      const selectedForPlotsIndicator =
        screen.getByLabelText('selected for plots')
      expect(selectedForPlotsIndicator).toHaveTextContent('7')

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(selectedForPlotsIndicator)

      const tooltip = screen.getByRole('tooltip')

      expect(tooltip).toHaveTextContent(
        '7 Experiments Selected for Plotting (Max 7)'
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
})
