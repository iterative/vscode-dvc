import React from 'react'
import { SelectMenu } from '../../../shared/components/selectMenu/SelectMenu'
import { SelectMenuOptionProps } from '../../../shared/components/selectMenu/SelectMenuOption'

export enum SortOrder {
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
  NONE = 'none'
}

export enum SortOrderLabel {
  ASCENDING = 'Sort Ascending',
  DESCENDING = 'Sort Descending',
  NONE = 'Remove Sort'
}

export const SortPicker: React.FC<{
  sortOrder: SortOrder
  setSelectedOrder: (order: SortOrder) => void
}> = ({ sortOrder, setSelectedOrder }) => {
  const options: SelectMenuOptionProps[] = [
    {
      id: SortOrder.ASCENDING,
      isSelected: sortOrder === SortOrder.ASCENDING,
      label: SortOrderLabel.ASCENDING
    },
    {
      id: SortOrder.DESCENDING,
      isSelected: sortOrder === SortOrder.DESCENDING,
      label: SortOrderLabel.DESCENDING
    },
    {
      id: SortOrder.NONE,
      isSelected: !sortOrder || sortOrder === SortOrder.NONE,
      label: SortOrderLabel.NONE
    }
  ]
  return (
    <SelectMenu
      options={options}
      onClick={id => {
        const order = (id as SortOrder) || SortOrder.NONE

        if (order !== sortOrder) {
          setSelectedOrder(order)
        }
      }}
    />
  )
}
