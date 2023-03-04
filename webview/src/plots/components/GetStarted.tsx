import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'
import { StartButton } from '../../shared/components/button/StartButton'

export type AddPlotsProps = {
  hasUnselectedPlots: boolean
}

export const AddPlots: React.FC<AddPlotsProps> = ({
  hasUnselectedPlots
}: AddPlotsProps) => (
  <div>
    <p>No Plots to Display.</p>
    <div>
      <StartButton
        onClick={() =>
          sendMessage({
            type: MessageFromWebviewType.SELECT_EXPERIMENTS
          })
        }
        text="Add Experiments"
      />
      {hasUnselectedPlots && (
        <StartButton
          isNested={hasUnselectedPlots}
          appearance="secondary"
          onClick={() =>
            sendMessage({
              type: MessageFromWebviewType.SELECT_PLOTS
            })
          }
          text="Add Plots"
        />
      )}
    </div>
  </div>
)

export const Welcome: React.FC = () => (
  <div>
    <p>No Plots Detected.</p>
    <StartButton
      onClick={() =>
        sendMessage({
          type: MessageFromWebviewType.SELECT_EXPERIMENTS
        })
      }
      text="Add Experiments"
    />
    <p>
      Learn how to{' '}
      <a href="https://dvc.org/doc/studio/user-guide/views/visualize-experiments">
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
