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
    <>
      <IconsWrapper>
        {Object.values(Icons).map(IconComponent => (
          <IconWrapper key={IconComponent.name} name={IconComponent.name}>
            <Icon icon={IconComponent} />
          </IconWrapper>
        ))}
      </IconsWrapper>
      <p>
        <a href="https://microsoft.github.io/vscode-codicons/dist/codicon.html">
          Other icons that can be added
        </a>
      </p>
      <p>
        Copy the icon name, add it to `codicons` constant in
        `webview/icons/generate.mjs` and run `yarn svgr`.
      </p>
    </>
  )
}

export const AllIcons = Template.bind({})
