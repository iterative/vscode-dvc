import type { StoryFn, Meta } from '@storybook/react'
import React from 'react'

import { IconWrapper } from './components/IconWrapper'
import { IconsWrapper } from './components/IconsWrapper'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { Icon } from '../shared/components/Icon'

import * as Icons from '../shared/components/icons'

export default {
  args: {
    data: {}
  },
  component: Icon,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Icons'
} as Meta

const Template: StoryFn = () => {
  return (
    <IconsWrapper>
      {Object.values(Icons).map(IconComponent => (
        <IconWrapper key={IconComponent.name} name={IconComponent.name}>
          <Icon icon={IconComponent} />
        </IconWrapper>
      ))}
    </IconsWrapper>
  )
}

export const AllIcons = Template.bind({})
