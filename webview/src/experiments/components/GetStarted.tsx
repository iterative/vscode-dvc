import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import { StartButton } from '../../shared/components/button/StartButton'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { sendMessage } from '../../shared/vscode'

export type GetStartedProps = {
  hasColumns: boolean
  hasOnlyWorkspace: boolean
}

export const GetStarted = ({
  hasColumns,
  hasOnlyWorkspace
}: GetStartedProps) => {
  return (
    <EmptyState>
      {hasColumns && !hasOnlyWorkspace && (
        <div>
          <p>No Columns Selected.</p>
          <StartButton
            onClick={() =>
              sendMessage({
                type: MessageFromWebviewType.SELECT_COLUMNS
              })
            }
            text={'Add Columns'}
          />
        </div>
      )}
      {(!hasColumns || hasOnlyWorkspace) && (
        <div>
          <p>No Experiments to Display.</p>
          <p>
            {'Get started with '}
            <a href="https://dvc.org/doc/start/experiments">experiments</a>
            {'.'}
          </p>
          <p>
            {'Learn about the '}
            <a href="https://dvc.org/doc/command-reference/exp">exp commands</a>
            {'.'}
          </p>
        </div>
      )}
    </EmptyState>
  )
}
