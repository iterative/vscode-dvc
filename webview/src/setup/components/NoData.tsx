import React from 'react'
import pyTorch from '../snippets/pyTorch.py'
import huggingFace from '../snippets/huggingFace.py'
import keras from '../snippets/keras.py'
import pythonApi from '../snippets/pythonApi.py'
import { CodeBlock } from '../../shared/components/codeBlock/CodeBlock'
import { CodeSlider } from '../../shared/components/codeSlider/CodeSlider'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const NoData: React.FC = () => {
  return (
    <EmptyState>
      <h1>Your project contains no data</h1>
      <div>
        Enable DVC experiment tracking using{' '}
        <a href="https://dvc.org/doc/dvclive">DVCLive</a> with{' '}
        <CodeBlock language="python" inline>
          save_dvc_exp=True
        </CodeBlock>
        . Use the callback for your framework or log your own metrics. You can
        find examples below (
        <a href="https://dvc.org/doc/dvclive/api-reference/ml-frameworks">
          other frameworks available
        </a>
        ).
      </div>
      <CodeSlider
        codeBlocks={[
          {
            children: pyTorch.toString(),
            language: 'python',
            title: 'PyTorch Lightning'
          },
          {
            children: huggingFace.toString(),
            language: 'python',
            title: 'Hugging Face'
          },
          {
            children: keras.toString(),
            language: 'python',
            title: 'Keras'
          },
          {
            children: pythonApi.toString(),
            language: 'python',
            title: 'General Python API'
          }
        ]}
      />
    </EmptyState>
  )
}
