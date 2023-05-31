/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from 'react'
import styles from './styles.module.scss'
import pyTorch from '../../snippets/pyTorch.py'
import huggingFace from '../../snippets/huggingFace.py'
import keras from '../../snippets/keras.py'
import pythonApi from '../../snippets/pythonApi.py'
import { CodeBlock } from '../shared/CodeBlock'
import { Panels } from '../shared/Panels'

const PythonCodeBlock = ({ children }: { children: string }) => (
  <CodeBlock language="python">{children}</CodeBlock>
)

export const DvcLiveExamples: React.FC = () => {
  return (
    <Panels
      className={styles.dvcLiveExamples}
      panels={[
        {
          children: <PythonCodeBlock>{pyTorch.toString()}</PythonCodeBlock>,
          title: 'PyTorch Lightning'
        },
        {
          children: <PythonCodeBlock>{huggingFace.toString()}</PythonCodeBlock>,
          title: 'Hugging Face'
        },
        {
          children: <PythonCodeBlock>{keras.toString()}</PythonCodeBlock>,
          title: 'Keras'
        },
        {
          children: <PythonCodeBlock>{pythonApi.toString()}</PythonCodeBlock>,
          title: 'General Python API'
        }
      ]}
    />
  )
}
