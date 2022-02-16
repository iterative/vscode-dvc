/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import rowsFixture from 'dvc/src/test/fixtures/expShow/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
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
import { TableData } from 'dvc/src/experiments/webview/contract'
import {
  ascendingSortableRowsTableDataFixture,
  sortableRowsTableDataFixture
} from 'dvc/src/test/fixtures/expShow/sortableRows'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'
import {
  commonColumnFields,
  expectHeaders,
  makeGetDragEl,
  tableData as sortingTableDataFixture
} from '../../test/sort'

jest.mock('../../shared/api')

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
        data: {
          columns: columnsFixture,
          rows: rowsFixture,
          sorts: []
        },
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

  it('should maintain expansion status when rows are reordered', () => {
    render(<App />)

    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: sortableRowsTableDataFixture,
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    const getRowLabels = () =>
      screen
        .queryAllByText(/^exp\w(checkpoint\w)?$/)
        .map(element => element.textContent)

    expect(getRowLabels()).toEqual([
      'expA',
      'expAcheckpointA',
      'expAcheckpointB',
      'expB',
      'expBcheckpointA',
      'expBcheckpointB',
      'expC',
      'expCcheckpointA',
      'expCcheckpointB'
    ])

    fireEvent.click(screen.getByText('expA'))

    expect(getRowLabels()).toEqual([
      'expA',
      'expB',
      'expBcheckpointA',
      'expBcheckpointB',
      'expC',
      'expCcheckpointA',
      'expCcheckpointB'
    ])

    const changedData: TableData = ascendingSortableRowsTableDataFixture

    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          data: changedData,
          type: MessageToWebviewType.SET_DATA
        }
      })
    )

    expect(getRowLabels()).toEqual([
      'expC',
      'expCcheckpointA',
      'expCcheckpointB',
      'expA',
      'expB',
      'expBcheckpointA',
      'expBcheckpointB'
    ])
  })
})
