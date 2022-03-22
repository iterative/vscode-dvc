import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import { SelectMenu } from '../shared/components/SelectMenu/SelectMenu'

import { IconMenu } from '../shared/components/IconMenu'
import { IconMenuItemProps } from '../shared/components/IconMenu/IconMenuItem'
import { AllIcons } from '../shared/components/Icon'
import { Theme } from '../shared/components/Theme'

const items: IconMenuItemProps[] = [
  {
    icon: AllIcons.PENCIL,
    onClick: () => alert('Rename'),
    tooltip: 'Rename'
  },
  {
    icon: AllIcons.DOWN_ARROW,
    onClick: () => alert('Move down'),
    tooltip: 'Move Down'
  },
  {
    icon: AllIcons.UP_ARROW,
    onClick: () => alert('Move up'),
    tooltip: 'Move Up'
  },
  {
    icon: AllIcons.LINES,
    onClickNode: (
      <SelectMenu
        options={[
          {
            id: 'auc',
            isSelected: false,
            label: 'AUC'
          },
          {
            id: 'loss',
            isSelected: false,
            label: 'loss'
          },
          {
            id: 'accuracy',
            isSelected: false,
            label: 'Accuracy'
          }
        ]}
        onClick={(id: string) => alert('selected ' + id)}
      />
    ),
    tooltip: 'Choose metrics'
  },
  {
    icon: AllIcons.DOTS,
    onClickNode: (
      <SelectMenu
        options={[
          {
            id: 'small',
            isSelected: true,
            label: 'Small'
          },
          {
            id: 'regular',
            isSelected: false,
            label: 'Regular'
          },
          {
            id: 'large',
            isSelected: false,
            label: 'Large'
          }
        ]}
        onClick={(id: string) => alert('selected ' + id)}
      />
    ),
    tooltip: 'View'
  }
]

export default {
  args: {
    items
  },
  component: IconMenu,
  title: 'Icon Menu'
} as Meta

const Template: Story<{
  items: IconMenuItemProps[]
}> = ({ items }) => (
  <Theme>
    <IconMenu items={items} />
  </Theme>
)

export const MenuWithIcons = Template.bind({})
