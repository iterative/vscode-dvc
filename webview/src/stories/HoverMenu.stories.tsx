import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import check from 'dvc/resources/check.svg'
import { SelectMenu } from '../shared/components/selectMenu/SelectMenu'
import { SelectMenuOptionProps } from '../shared/components/selectMenu/SelectMenuOption'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import { HoverMenu } from '../shared/components/hoverMenu/HoverMenu'

const options: SelectMenuOptionProps[] = [
  {
    id: 'a',
    isSelected: false,
    label: 'Option A'
  },
  {
    id: 'b',
    isSelected: true,
    label: 'Option B'
  },
  {
    id: 'c',
    isSelected: true,
    label: 'Option C'
  },
  {
    id: 'd',
    isSelected: false,
    label: 'Option D'
  }
]

export default {
  args: {},
  component: HoverMenu,
  title: 'Hover Menu'
} as Meta

const Template: Story<{
  children: React.ReactNode
  options?: SelectMenuOptionProps[]
  onClick: (id: string) => void
  selectedImage: string
}> = ({ options, onClick, selectedImage }) => (
  <HoverMenu show>
    {options ? (
      <SelectMenu
        options={options}
        onClick={onClick}
        selectedImage={selectedImage}
      />
    ) : (
      <div>Tooltip</div>
    )}
  </HoverMenu>
)

export const Tooltip = Template.bind({})

export const MultiSelect = Template.bind({})
MultiSelect.args = {
  options,
  selectedImage: check
}
MultiSelect.argTypes = {
  onClick: { action: 'clicked' }
}
