import React from 'react'
import styles from './styles.module.scss'
import { requestStudioToken, saveStudioToken } from '../../util/messages'
import { Button } from '../../../shared/components/button/Button'

export const GetToken: React.FC = () => {
  return (
    <>
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
    </>
  )
}
