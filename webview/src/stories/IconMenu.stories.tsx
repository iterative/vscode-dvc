import type { StoryFn, Meta } from '@storybook/react'
import React from 'react'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { SelectMenu } from '../shared/components/selectMenu/SelectMenu'

import { IconMenu } from '../shared/components/iconMenu/IconMenu'
import { IconMenuItemProps } from '../shared/components/iconMenu/IconMenuItem'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import { Dots, DownArrow, Lines, UpArrow } from '../shared/components/icons'

const items: IconMenuItemProps[] = [
  {
    icon: DownArrow,
    onClick: () => alert('Move down'),
    tooltip: 'Move Down'
  },
  {
    icon: UpArrow,
    onClick: () => alert('Move up'),
    tooltip: 'Move Up'
  },
  {
    icon: Lines,
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
    icon: Dots,
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
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Icon Menu'
} as Meta

const Template: StoryFn<{
  items: IconMenuItemProps[]
}> = ({ items }) => (
  <WebviewWrapper>
    <IconMenu items={items} />
  </WebviewWrapper>
)

export const MenuWithIcons = Template.bind({})
