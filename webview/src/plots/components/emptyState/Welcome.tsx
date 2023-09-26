import React from 'react'
import { StartButton } from '../../../shared/components/button/StartButton'
import { addPlot, selectRevisions } from '../../util/messages'

export const Welcome: React.FC = () => (
  <div>
    <p>No Plots Detected.</p>
    <div>
      <StartButton onClick={addPlot} text="Add Plot" />
      <StartButton
        appearance="secondary"
        onClick={selectRevisions}
        text="Add Experiments"
        isNested={true}
      />
    </div>
    <p>
      Learn how to{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots">
        visualize experiments
      </a>{' '}
      with DVC.
    </p>
    <p>
      Learn about the{' '}
      <a href="https://dvc.org/doc/command-reference/plots">plots commands</a>.
    </p>
  </div>
)
