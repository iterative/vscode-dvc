import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'
import { StartButton } from '../../shared/components/button/StartButton'

export type AddPlotsProps = {
  hasUnselectedPlots: boolean
  hasNoCustomPlots: boolean
}

export const AddPlots: React.FC<AddPlotsProps> = ({
  hasUnselectedPlots,
  hasNoCustomPlots
}: AddPlotsProps) => (
  <div>
    <p>
      {hasNoCustomPlots
        ? 'No Plots to Display'
        : 'No Selected Plots or Experiments'}
    </p>
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
      {hasNoCustomPlots && (
        <StartButton
          isNested={hasNoCustomPlots}
          appearance="secondary"
          onClick={() =>
            sendMessage({
              type: MessageFromWebviewType.ADD_CUSTOM_PLOT
            })
          }
          text="Add Custom Plot"
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
