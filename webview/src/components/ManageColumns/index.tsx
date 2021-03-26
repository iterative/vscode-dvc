import React from 'react'
import { InstanceProp } from '../Table'
import { MenuItemGroup, MenuItem, MenuSeparator } from '../Menu/index'
import styles from './styles.module.scss'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import { Dropdown, DropdownToggle } from '../Dropdown'
import { TabButton } from '../Button'
import { Input } from '../Input'
import Fuse from 'fuse.js'
import { minWordLength } from '../../util/strings'

type TabId = 'general' | 'metrics' | 'parameters'

const ManageColumns: React.FC<InstanceProp> = ({ instance }) => {
  const { columns: columnInstances } = instance
  const [isOpen, setIsOpen] = React.useState(false)
  const [tabId, setTabId] = React.useState<TabId>('general')
  const [searchTerm, setSearchTerm] = React.useState<string | null>(null)

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const onSelect = (column: ColumnInstance<Experiment>) => {
    column.toggleHidden()
  }

  const onSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.value.trim() !== '') {
      setSearchTerm(e.target.value)
    } else {
      setSearchTerm(null)
    }
  }

  const matchesTab = (column: ColumnInstance<Experiment>): boolean => {
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

  const columnOptions = (
    column: ColumnInstance<Experiment>,
    filterBySearch = true
  ) => {
    let searchDisqualified = false
    if (filterBySearch) {
      if (searchTerm !== null) {
        const fuse = new Fuse([column.id, column.Header], {
          ignoreLocation: true,
          includeScore: true,
          useExtendedSearch: true,
          minMatchCharLength: minWordLength(searchTerm)
        })
        if (!fuse.search(searchTerm).length) {
          searchDisqualified = true
        }
      }
    }

    const children =
      column.columns &&
      column.columns
        .map(childColumn => columnOptions(childColumn, searchDisqualified))
        .filter(Boolean)

    if (searchDisqualified && !children?.length) {
      return
    }

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
        {children}
      </div>
    )
  }

  const menuItems = [
    <MenuItemGroup id="column-visibility" key="column-visibility-group">
      {columnInstances.map(column => {
        if (matchesTab(column)) {
          const content = columnOptions(column)
          if (content) {
            return <div key={column.id}>{content}</div>
          }
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
      <Input placeholder={'Search'} fullWidth onInput={onSearchInput} />
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
