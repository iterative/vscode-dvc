import React, { createContext, useState } from 'react'
import { RowProp } from './interfaces'

export interface RowSelectionContextValue {
  selectedRows: Record<string, RowProp | undefined>
  toggleRowSelected: ((row: RowProp) => void) | undefined
}

export const RowSelectionContext = createContext<RowSelectionContextValue>({
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

  return (
    <RowSelectionContext.Provider value={{ selectedRows, toggleRowSelected }}>
      {children}
    </RowSelectionContext.Provider>
  )
}
