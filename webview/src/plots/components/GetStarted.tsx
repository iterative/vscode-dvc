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
        <p>No Plots to Display</p>
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
      </div>
    </EmptyState>
  )
}
