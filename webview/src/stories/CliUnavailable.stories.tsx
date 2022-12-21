import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import {
  CliUnavailable,
  CliUnavailableProps
} from '../setup/components/CliUnavailable'

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
  isPythonExtensionInstalled,
  pythonBinPath
}) => {
  return (
    <CliUnavailable
      isPythonExtensionInstalled={isPythonExtensionInstalled}
      pythonBinPath={pythonBinPath}
      installDvc={() => undefined}
      setupWorkspace={() => undefined}
      selectPythonInterpreter={() => undefined}
    />
  )
}

export const PythonNotFound = Template.bind({})
PythonNotFound.args = {
  isPythonExtensionInstalled: false,
  pythonBinPath: undefined
}

export const PythonExtensionUsed = Template.bind({})
PythonExtensionUsed.args = {
  isPythonExtensionInstalled: true,
  pythonBinPath: '/opt/homebrew/Caskroom/miniforge/base/bin/python'
}

export const PythonExtensionNotUsed = Template.bind({})
PythonExtensionNotUsed.args = {
  isPythonExtensionInstalled: false,
  pythonBinPath: '.env/bin/python'
}
