import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import { StartButton } from '../../shared/components/button/StartButton'
import { sendMessage } from '../../shared/vscode'

export const NoExperiments: React.FC = () => (
  <div>
    <p>No Experiments to Display.</p>
    <p>
      Get started with{' '}
      <a href="https://dvc.org/doc/start/experiments">experiments</a>.
    </p>
    <p>
      Learn about the{' '}
      <a href="https://dvc.org/doc/command-reference/exp">exp commands</a>.
    </p>
  </div>
)

export const AddColumns: React.FC = () => (
  <div>
    <p>No Columns Selected.</p>
    <StartButton
      onClick={() =>
        sendMessage({
          type: MessageFromWebviewType.SELECT_COLUMNS
        })
      }
      text="Add Columns"
    />
  </div>
)
