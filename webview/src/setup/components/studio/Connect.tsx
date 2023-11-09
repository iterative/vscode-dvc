import React from 'react'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { requestStudioToken, saveStudioToken } from '../../util/messages'
import { Button } from '../../../shared/components/button/Button'

export const Connect: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
      <div data-testid="setup-studio-content">
        <h1>
          Connect to <a href={STUDIO_URL}>Studio</a>
        </h1>
        <p>
          Share experiments and plots with collaborators directly from your IDE.
          Start sending data with an{' '}
          <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#set-up-an-access-token">
            access token
          </a>{' '}
          generated from your Studio profile page. Request a token below or{' '}
          <button className={styles.buttonAsLink} onClick={saveStudioToken}>
            add an already created token
          </button>
          .
        </p>
        <Button text="Get Token" onClick={requestStudioToken} />
        <p>
          Don&apos;t Have an account? <a href={STUDIO_URL}>Get Started</a>
        </p>
      </div>
    </EmptyState>
  )
}
