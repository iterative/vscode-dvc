import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { Slider } from '../shared/components/slider/Slider'

export default {
  args: {
    defaultValue: 2,
    label: 'Slider with a max',
    maximum: 10
  },
  component: Slider,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Slider'
} as Meta

const Template: Story<{
  maximum: number
  defaultValue: number
  label: string
}> = ({ maximum, defaultValue, label }) => (
  <Slider
    maximum={maximum}
    defaultValue={defaultValue}
    label={label}
    onChange={() => {}}
  />
)

export const MinMaxSliderWithOnlyMax = Template.bind({})
