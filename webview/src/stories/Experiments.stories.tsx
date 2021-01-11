import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import Experiments from '../components/Experiments'

import complexExperimentsData from './complex-experiments-output.json'

import './test-vscode-styles.scss'
import '../style.scss'

const dummyVsCodeAPI = {
  postMessage(message: any) {
    console.log(message)
  }
}

export default {
  title: 'Experiments/Table',
  component: Experiments
} as Meta

export const ComplexTable: Story = () => {
  return (
    <Experiments
      experiments={complexExperimentsData}
      vsCodeApi={dummyVsCodeAPI}
    />
  )
}
