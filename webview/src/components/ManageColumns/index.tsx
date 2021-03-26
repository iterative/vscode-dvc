import React from 'react'
import { InstanceProp } from '../Table'
import { MenuItemGroup } from '../Menu/index'
import styles from './styles.module.scss'
import { ColumnInstance } from 'react-table'
import { Experiment } from '../../util/parse-experiments'
import { Dropdown, DropdownToggle } from '../Dropdown'
import { TabButton } from '../Button'
import { Input } from '../Input'
import { ColumnRows } from './rows'

export type TabId = 'general' | 'metrics' | 'parameters'

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
