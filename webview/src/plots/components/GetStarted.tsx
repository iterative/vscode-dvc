import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { StartButton } from '../../shared/components/button/StartButton'

export type GetStartedProps = {
  hasPlots?: boolean
  hasSelectedPlots?: boolean
  hasSelectedRevisions?: boolean
}

export const GetStarted = ({
  hasPlots,
  hasSelectedPlots,
  hasSelectedRevisions
}: GetStartedProps) => {
  return (
    <EmptyState>
      <div>
        <p>No Plots to Display.</p>
        {hasPlots && (
          <div>
            {!hasSelectedPlots && (
              <StartButton
                onClick={() =>
                  sendMessage({
                    type: MessageFromWebviewType.SELECT_PLOTS
                  })
                }
                text={'Add Plots'}
              />
            )}
            {!hasSelectedRevisions && (
              <StartButton
                appearance={!hasSelectedPlots ? 'secondary' : 'primary'}
                isNested={!hasSelectedPlots}
                onClick={() =>
                  sendMessage({
                    type: MessageFromWebviewType.SELECT_EXPERIMENTS
                  })
                }
                text={'Add Experiments'}
              />
            )}
          </div>
        )}
        {!hasPlots && (
          <div>
            <p>
              {'Learn how to '}
              <a href="https://dvc.org/doc/studio/user-guide/views/visualize-experiments">
                visualize experiments
              </a>
              {' with DVC.'}
            </p>
            <p>
              {'Learn about the '}
              <a href="https://dvc.org/doc/command-reference/plots">
                plots commands
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </EmptyState>
  )
}
