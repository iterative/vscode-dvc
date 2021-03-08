import React from 'react'
import { InstanceProp } from '../Table'
import {
  MenuToggle,
  Menu,
  MenuItemGroup,
  MenuItem,
  MenuSeparator
} from '../Menu/index'
import styles from './styles.module.scss'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'

const ManageColumns: React.FC<InstanceProp> = ({ instance }) => {
  const { columns: columnInstances } = instance
  const [isOpen, setIsOpen] = React.useState(false)

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const onSelect = (column: ColumnInstance<Experiment>) => {
    column.toggleHidden()
  }

  const toggle = (
    <MenuToggle
      onToggle={onToggle}
      toggleTemplate={'Manage Columns'}
      id="toggle"
    />
  )

  const columnOptions = (column: ColumnInstance<Experiment>) => (
    <div key={column.id}>
      {!column.canSort && (
        <>
          <MenuSeparator key={column.id} />
          <span
            key={`${column.id}-column-group`}
            className={styles.manageColumns__columnGroup}
          >
            {'-'.repeat(column.depth)}
            {column.Header}
          </span>
        </>
      )}
      {column.canSort && (
        <MenuItem
          id={column.id}
          key={`manage-column-${column.id}`}
          onClick={() => onSelect(column)}
        >
          <input
            type="checkbox"
            id={column.id}
            defaultChecked={column.isVisible}
            key={`manage-column-input-${column.id}`}
          />
          <span key={`column-${column.Header}-span`}>
            {'-'.repeat(column.depth)}
          </span>
          {column.Header}
        </MenuItem>
      )}
      {column.columns &&
        column.columns.map(childColumn => columnOptions(childColumn))}
    </div>
  )

  const menuItems = [
    <MenuItemGroup id="column-visibility" key="column-visibility-group">
      {columnInstances.map(column => {
        return <div key={column.id}>{columnOptions(column)}</div>
      })}
    </MenuItemGroup>
  ]

  return (
    <Menu
      id="manage-columns"
      menuItems={menuItems}
      isOpen={isOpen}
      toggle={toggle}
    />
  )
}

export default ManageColumns
