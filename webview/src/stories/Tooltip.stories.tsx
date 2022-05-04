import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import Tooltip from '../shared/components/tooltip/Tooltip'
import { SelectMenu } from '../shared/components/selectMenu/SelectMenu'

export default {
  argTypes: {
    arrow: {
      control: { type: 'boolean' }
    },
    placement: {
      control: { type: 'radio' },
      options: [undefined, 'top', 'bottom', 'left', 'right']
    }
  },
  component: Tooltip,
  title: 'Tooltip'
} as Meta

const Template: Story = args => (
  <div
    style={{
      backgroundColor: 'gray',
      display: 'inline-block',
      padding: '10em'
    }}
  >
    <Tooltip visible={true} content="Content" {...args}>
      <div
        style={{
          backgroundColor: 'black',
          display: 'inline-block',
          padding: '0.5em'
        }}
      >
        Target
      </div>
    </Tooltip>
  </div>
)

export const Default = Template.bind({})

export const WithSelectMenu = Template.bind({})
WithSelectMenu.args = {
  content: (
    <SelectMenu
      options={[
        { id: '1', isSelected: false, label: 'Option 1' },
        { id: '2', isSelected: true, label: 'Option 2' },
        { id: '3', isSelected: false, label: 'Option 3' }
      ]}
      onClick={() => {}}
    />
  ),
  interactive: true
}
