import React, { createContext, useState } from 'react'
import { RowProp } from './interfaces'

export interface RowSelectionContextValue {
  selectedRows: Record<string, RowProp | undefined>
  lastSelectedRow?: RowProp
  toggleRowSelected?: (row: RowProp) => void
  batchSelection?: (batch: RowProp[]) => void
  clearSelectedRows: (() => void) | undefined
}

export const RowSelectionContext = createContext<RowSelectionContextValue>({
  batchSelection: undefined,
  clearSelectedRows: undefined,
  selectedRows: {},
  toggleRowSelected: undefined
})

export const RowSelectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [selectedRows, setSelectedRows] = useState<
    Record<string, RowProp | undefined>
  >({})

  const [selectionHistory, setSelectionHistory] = useState<string[]>([])

  const toggleRowSelected = (rowProp: RowProp) => {
    const {
      row: {
        values: { id }
      }
    } = rowProp
    setSelectedRows({
      ...selectedRows,
      [id]: selectedRows[id] ? undefined : rowProp
    })
    setSelectionHistory([id, ...selectionHistory])
  }

  const batchSelection = (batch: RowProp[]) => {
    const selectedRowsCopy = { ...selectedRows }

    for (const rowProp of batch) {
      const {
        row: {
          values: { id }
        }
      } = rowProp
      selectedRowsCopy[id] = rowProp
    }

    setSelectedRows(selectedRowsCopy)
    setSelectionHistory([
      ...batch.map(
        ({
          row: {
            values: { id }
          }
        }) => id
      ),
      ...selectionHistory
    ])
  }

  const clearSelectedRows = () => {
    setSelectedRows({})
    setSelectionHistory([])
  }

  const lastSelectedRow = React.useMemo(() => {
    const lastSelectedId = selectionHistory.find(id => selectedRows[id]) ?? ''

    return selectedRows[lastSelectedId]
  }, [selectedRows, selectionHistory])

  return (
    <RowSelectionContext.Provider
      value={{
        batchSelection,
        clearSelectedRows,
        lastSelectedRow,
        selectedRows,
        toggleRowSelected
      }}
    >
      {children}
    </RowSelectionContext.Provider>
  )
}
