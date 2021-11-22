import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { SelectMenu } from '../shared/components/selectMenu/SelectMenu'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import pencil from '../../../extension/resources/pencil.svg'
import downArrow from '../../../extension/resources/down_arrow.svg'
import upArrow from '../../../extension/resources/up_arrow.svg'
import lines from '../../../extension/resources/lines.svg'
import check from '../../../extension/resources/check.svg'
import dots from '../../../extension/resources/dots.svg'

import { IconMenu } from '../shared/components/iconMenu/IconMenu'
import { IconMenuItemProps } from '../shared/components/iconMenu/IconMenuItem'

const items: IconMenuItemProps[] = [
  {
    icon: pencil,
    onClick: () => alert('Rename'),
    tooltip: 'Rename'
  },
  {
    icon: downArrow,
    onClick: () => alert('Move down'),
    tooltip: 'Move Down'
  },
  {
    icon: upArrow,
    onClick: () => alert('Move up'),
    tooltip: 'Move Up'
  },
  {
    icon: lines,
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
        selectedImage={check}
      />
    ),
    tooltip: 'Choose metrics'
  },
  {
    icon: dots,
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
            label: 'regular'
          },
          {
            id: 'large',
            isSelected: false,
            label: 'Large'
          }
        ]}
        onClick={(id: string) => alert('selected ' + id)}
        selectedImage={check}
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
}> = ({ items }) => <IconMenu items={items} />

export const MenuWithIcons = Template.bind({})
