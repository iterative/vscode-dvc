import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import {
  CliUnavailable,
  CliUnavailableProps
} from '../getStarted/components/CliUnavailable'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: CliUnavailable,
  title: 'Cli Unavailable'
} as Meta

const Template: Story<CliUnavailableProps> = ({
  isPythonExtensionUsed,
  pythonBinPath
}) => {
  return (
    <CliUnavailable
      isPythonExtensionUsed={isPythonExtensionUsed}
      pythonBinPath={pythonBinPath}
    />
  )
}

export const PythonNotFound = Template.bind({})
PythonNotFound.args = {
  isPythonExtensionUsed: false,
  pythonBinPath: undefined
}

export const PythonExtensionUsed = Template.bind({})
PythonExtensionUsed.args = {
  isPythonExtensionUsed: true,
  pythonBinPath: '/opt/homebrew/Caskroom/miniforge/base/bin/python'
}

export const PythonExtensionNotUsed = Template.bind({})
PythonExtensionNotUsed.args = {
  isPythonExtensionUsed: false,
  pythonBinPath: '.env/bin/python'
}
