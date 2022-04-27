import { Meta, Story } from '@storybook/react/types-6-0'
import React, { useState } from 'react'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import { Theme } from '../shared/components/theme/Theme'
import {
  ContextMenu,
  ContextMenuProps
} from '../shared/components/contextMenu/ContextMenu'
import { AllIcons, Icon } from '../shared/components/Icon'

export default {
  args: {},
  component: ContextMenu,
  title: 'Context Menu'
} as Meta

const Template: Story<ContextMenuProps> = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Theme>
      <ContextMenu open={menuOpen} onClickOutside={() => setMenuOpen(false)}>
        <span
          onContextMenu={e => {
            e.preventDefault()
            setMenuOpen(true)
          }}
        >
          <Icon width={15} icon={AllIcons.LINES} />
        </span>
      </ContextMenu>
    </Theme>
  )
}

export const WithOptions = Template.bind({})
