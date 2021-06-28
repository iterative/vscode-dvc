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

const summary = 'summary.json'
const params = 'params.yaml'

export const ComplexTable: Story = ({ experiments, vsCodeApi }) => {
  return (
    <Experiments
      experiments={experiments}
      vsCodeApi={vsCodeApi}
      metrics={[
        {
          childColumns: [
            {
              ancestors: [summary],
              maxNumber: 2.048856019973755,
              maxStringLength: 18,
              minNumber: 1.775016188621521,
              name: 'loss',
              types: ['number']
            },
            {
              ancestors: [summary],
              maxNumber: 0.5926499962806702,
              maxStringLength: 19,
              minNumber: 0.3484833240509033,
              name: 'accuracy',
              types: ['number']
            },
            {
              ancestors: [summary],
              maxNumber: 1.9979370832443237,
              maxStringLength: 18,
              minNumber: 1.7233840227127075,
              name: 'val_loss',
              types: ['number']
            },
            {
              ancestors: [summary],
              maxNumber: 0.6704000234603882,
              maxStringLength: 19,
              minNumber: 0.4277999997138977,
              name: 'val_accuracy',
              types: ['number']
            }
          ],
          name: summary
        }
      ]}
      params={[
        {
          childColumns: [
            {
              ancestors: [params],
              maxNumber: 5,
              maxStringLength: 1,
              minNumber: 2,
              name: 'epochs',
              types: ['number']
            },
            {
              ancestors: [params],
              maxNumber: 2.2e-7,
              maxStringLength: 6,
              minNumber: 2e-12,
              name: 'learning_rate',
              types: ['number']
            },
            {
              ancestors: [params],
              maxStringLength: 8,
              name: 'dvc_logs_dir',
              types: ['string']
            },
            {
              ancestors: [params],
              maxStringLength: 8,
              name: 'log_file',
              types: ['string']
            },
            {
              ancestors: [params],
              maxNumber: 0.15,
              maxStringLength: 5,
              minNumber: 0.122,
              name: 'dropout',
              types: ['number']
            },
            {
              ancestors: [params],
              childColumns: [
                {
                  ancestors: [params, 'process'],
                  maxNumber: 0.86,
                  maxStringLength: 4,
                  minNumber: 0.85,
                  name: 'threshold',
                  types: ['number']
                },
                {
                  ancestors: [params, 'process'],
                  maxNumber: 3,
                  maxStringLength: 6,
                  minNumber: 3,
                  name: 'test_arg',
                  types: ['string', 'number']
                }
              ],
              name: 'process'
            }
          ],
          name: params
        }
      ]}
    />
  )
}
