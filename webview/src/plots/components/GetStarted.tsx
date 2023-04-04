import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { ErrorIcon } from './ErrorIcon'
import { refreshRevisions } from './messages'
import { sendMessage } from '../../shared/vscode'
import { StartButton } from '../../shared/components/button/StartButton'
import { RefreshButton } from '../../shared/components/button/RefreshButton'

export type AddPlotsProps = {
  hasUnselectedPlots: boolean
  hasNoCustomPlots: boolean
  cliError: string | undefined
}

export const AddPlots: React.FC<AddPlotsProps> = ({
  cliError,
  hasUnselectedPlots,
  hasNoCustomPlots
}: AddPlotsProps) => (
  <div>
    {cliError && <ErrorIcon error={cliError} size={96} />}
    <p>No Plots to Display</p>
    <div>
      <StartButton
        onClick={() =>
          sendMessage({
            type: MessageFromWebviewType.SELECT_EXPERIMENTS
          })
        }
        text="Add Experiments"
      />
      {hasUnselectedPlots && !cliError && (
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
      {cliError && (
        <RefreshButton
          onClick={refreshRevisions}
          isNested={true}
          appearance="secondary"
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
