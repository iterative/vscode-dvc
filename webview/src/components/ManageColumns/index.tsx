import React from 'react'
import { InstanceProp } from '../Table'
import { MenuItemGroup, MenuItem, MenuSeparator } from '../Menu/index'
import styles from './styles.module.scss'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import { Dropdown, DropdownToggle } from '../Dropdown'
import { TabButton } from '../Button'

type TabId = 'general' | 'metrics' | 'parameters'

const ManageColumns: React.FC<InstanceProp> = ({ instance }) => {
  const { columns: columnInstances } = instance
  const [isOpen, setIsOpen] = React.useState(false)
  const [tabId, setTabId] = React.useState<TabId>('general')

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const onSelect = (column: ColumnInstance<Experiment>) => {
    column.toggleHidden()
  }

  const matchesFilter = (column: ColumnInstance<Experiment>): boolean => {
    const id = column.id
    const [parts] = id.split(']')
    if (parts === '[params') {
      return tabId === 'parameters'
    } else if (parts === '[metrics') {
      return tabId === 'metrics'
    } else {
      return tabId === 'general'
    }
  }

  const toggle = (
    <DropdownToggle
      className={styles.manageColumns__toggleBtn}
      onToggle={onToggle}
      toggleTemplate={'Manage Columns'}
      id="toggle"
    />
  )

  const columnOptions = (column: ColumnInstance<Experiment>) => {
    return (
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
              checked={column.isVisible}
              readOnly
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
  }

  const menuItems = [
    <MenuItemGroup id="column-visibility" key="column-visibility-group">
      {columnInstances.map(column => {
        if (matchesFilter(column)) {
          return <div key={column.id}>{columnOptions(column)}</div>
        }
      })}
    </MenuItemGroup>
  ]

  const columnTabs = (
    <div>
      <TabButton
        active={tabId === 'general'}
        onClick={() => setTabId('general')}
      >
        GENERAL
      </TabButton>
      <TabButton
        active={tabId === 'metrics'}
        onClick={() => setTabId('metrics')}
      >
        METRICS
      </TabButton>
      <TabButton
        active={tabId === 'parameters'}
        onClick={() => setTabId('parameters')}
      >
        PARAMETERS
      </TabButton>
    </div>
  )

  const content = (
    <div className={styles.manageColumns}>
      {columnTabs}
      {menuItems}
    </div>
  )

  return (
    <Dropdown
      id="manage-columns"
      toggle={toggle}
      content={content}
      isOpen={isOpen}
    />
  )
}

export default ManageColumns
