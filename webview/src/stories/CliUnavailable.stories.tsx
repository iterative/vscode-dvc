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
  title: 'Setup'
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

export const NoCLIPythonNotFound = Template.bind({})
NoCLIPythonNotFound.args = {
  isPythonExtensionInstalled: false,
  pythonBinPath: undefined
}

export const NoCLIPythonExtensionUsed = Template.bind({})
NoCLIPythonExtensionUsed.args = {
  isPythonExtensionInstalled: true,
  pythonBinPath: '/opt/homebrew/Caskroom/miniforge/base/bin/python'
}

export const NoCLIPythonExtensionNotUsed = Template.bind({})
NoCLIPythonExtensionNotUsed.args = {
  isPythonExtensionInstalled: false,
  pythonBinPath: '.env/bin/python'
}
