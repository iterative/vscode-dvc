import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { STUDIO_URL } from 'dvc/src/connect/webview/contract'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Button } from '../../shared/components/button/Button'
import { sendMessage } from '../../shared/vscode'

export const Studio: React.FC = () => {
  const openStudio = () =>
    sendMessage({ type: MessageFromWebviewType.OPEN_STUDIO })

  const openStudioProfile = () =>
    sendMessage({ type: MessageFromWebviewType.OPEN_STUDIO_PROFILE })

  const saveStudioToken = () =>
    sendMessage({ type: MessageFromWebviewType.SAVE_STUDIO_TOKEN })

  return (
    <EmptyState>
      <div>
        <h1>
          Connect to <a href={STUDIO_URL}>Studio</a>
        </h1>
        <p>
          To share experiments and plots with collaborators directly from your
          IDE.
        </p>
        <p>
          An{' '}
          <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#set-up-an-access-token">
            access token
          </a>{' '}
          can be generated from your Studio profile page.
        </p>
        <Button
          appearance="primary"
          isNested={false}
          text={'Sign In'}
          onClick={openStudio}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text={'Get Token'}
          onClick={openStudioProfile}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text={'Save'}
          onClick={saveStudioToken}
        />
        <p>
          {"Don't Have an account?\n"}
          <a href={STUDIO_URL}>Sign-Up</a>
        </p>
      </div>
    </EmptyState>
  )
}
