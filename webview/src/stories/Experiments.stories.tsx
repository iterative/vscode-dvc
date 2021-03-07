import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'

import Experiments from '../components/Experiments/index'

import complexExperimentsData from 'dvc/src/webviews/experiments/complex-output-example.json'

import './test-vscode-styles.scss'
import '../style.scss'

const dummyVsCodeApi = {
  postMessage: action('postMessage')
}

export default {
  title: 'Experiments/Table',
  component: Experiments,
  args: {
    experiments: complexExperimentsData,
    vsCodeApi: dummyVsCodeApi
  },
  argTypes: {
    vsCodeApi: {
      table: {
        disable: true
      }
    }
  }
} as Meta

export const ComplexTable: Story = ({ experiments, vsCodeApi }) => {
  return <Experiments experiments={experiments} vsCodeApi={vsCodeApi} />
}
