/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from 'react'
import styles from './styles.module.scss'
import { PythonCodeBlock } from './PythonCodeBlock'
import { OtherFrameworks } from './OtherFrameworks'
import pyTorch from '../../snippets/pyTorch.py'
import huggingFace from '../../snippets/huggingFace.py'
import keras from '../../snippets/keras.py'
import pythonApi from '../../snippets/pythonApi.py'
import { Panels } from '../shared/Panels'
import { InfoText } from '../shared/InfoText'

export const DvcLiveExamples: React.FC = () => (
  <>
    <Panels
      className={styles.dvcLiveExamples}
      panels={[
        {
          children: <PythonCodeBlock>{pythonApi.toString()}</PythonCodeBlock>,
          title: 'Python API'
        },
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
          children: <OtherFrameworks />,
          title: 'Other'
        }
      ]}
    />
    <InfoText>
      DVCLive snippets are provided for most frameworks. Type dvclive- in a
      Python file to see the full list.
    </InfoText>
  </>
)
