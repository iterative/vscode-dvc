import React, { createContext, useState } from 'react'
import { RowProp } from './interfaces'

export interface RowSelectionContextValue {
  selectedRows: Record<string, RowProp | undefined>
  toggleRowSelected: ((row: RowProp) => void) | undefined
  batchSelection: ((batch: RowProp[]) => void) | undefined
  clearSelectedRows: (() => void) | undefined
}

export const RowSelectionContext = createContext<RowSelectionContextValue>({
  batchSelection: undefined,
  clearSelectedRows: undefined,
  selectedRows: {},
  toggleRowSelected: undefined
})

export const RowSelectionProvider: React.FC = ({ children }) => {
  const [selectedRows, setSelectedRows] = useState<
    Record<string, RowProp | undefined>
  >({})

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
  }

  const clearSelectedRows = () => {
    setSelectedRows({})
  }

  return (
    <RowSelectionContext.Provider
      value={{
        batchSelection,
        clearSelectedRows,
        selectedRows,
        toggleRowSelected
      }}
    >
      {children}
    </RowSelectionContext.Provider>
  )
}
