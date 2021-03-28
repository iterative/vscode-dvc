import React from 'react'
import { InstanceProp } from '../Table'
import { MenuItemGroup } from '../Menu/index'
import styles from './styles.module.scss'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import { Dropdown, DropdownToggle } from '../Dropdown'
import { TabButton } from '../Button'
import { Input } from '../Input'
import { ColumnRows } from './ColumnRows'

// NOTE: perhaps we might want to make tabs dynamic in the future.
export type TabId = 'general' | 'params' | 'metrics'

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

  const toggle = (
    <DropdownToggle
      className={styles.manageColumns__toggleBtn}
      onToggle={onToggle}
      toggleTemplate={'Manage Columns'}
      id="toggle"
    />
  )

  const matchesTab = (column: ColumnInstance<Experiment>): boolean => {
    if (!column.category) {
      return tabId === 'general'
    }
    return tabId === column.category
  }

  const menuItems = [
    <MenuItemGroup id="column-visibility" key="column-visibility-group">
      {columnInstances.map(column => {
        if (matchesTab(column)) {
          return (
            <div key={column.id}>
              <ColumnRows
                searchTerm={searchTerm}
                column={column}
                onToggle={onSelect}
              />
            </div>
          )
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
      <TabButton active={tabId === 'params'} onClick={() => setTabId('params')}>
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
