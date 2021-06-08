import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'

import complexExperimentsData from 'dvc/src/experiments/webview/complex-output-example.json'
import Experiments from '../components/Experiments'

import './test-vscode-styles.scss'
import '../style.scss'

const dummyVsCodeApi = {
  postMessage: action('postMessage')
}

export default {
  argTypes: {
    vsCodeApi: {
      table: {
        disable: true
      }
    }
  },
  args: {
    experiments: complexExperimentsData,
    vsCodeApi: dummyVsCodeApi
  },
  component: Experiments,
  title: 'Experiments/Table'
} as Meta

export const ComplexTable: Story = ({ experiments, vsCodeApi }) => {
  return <Experiments experiments={experiments} vsCodeApi={vsCodeApi} />
}
