/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from 'react'
import { CodeSlider } from '../../../shared/components/codeSlider/CodeSlider'
import pyTorch from '../../snippets/pyTorch.py'
import huggingFace from '../../snippets/huggingFace.py'
import keras from '../../snippets/keras.py'
import pythonApi from '../../snippets/pythonApi.py'

export const DvcLiveExamples: React.FC = () => {
  return (
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
  )
}
