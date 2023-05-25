import React from 'react'
import { DvcLiveExamples } from './DvcLiveExamples'
import { CodeBlock } from '../../../shared/components/codeBlock/CodeBlock'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const NoData: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
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
        ). Once you have successfully added DVCLive to your project, do not
        forget to run your script to see experiments and plots in action.
      </div>
      <DvcLiveExamples />
    </EmptyState>
  )
}
