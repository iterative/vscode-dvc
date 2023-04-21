import React, { ReactElement } from 'react'
import { DvcCliDetails } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'
import { setupWorkspace } from '../messages'

const InfoRow: React.FC<{
  title: string
  text: string | ReactElement
}> = ({ title, text }) => (
  <tr>
    <td className={styles.infoKey}>{title}</td>
    <td className={styles.infoValue}>{text}</td>
  </tr>
)

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  location,
  version
}) => {
  const commandText = location || 'Not found'
  const command = (
    <span>
      <span className={styles.code}>{commandText}</span> (
      <button className={styles.buttonAsLink} onClick={setupWorkspace}>
        Setup workspace
      </button>
      )
    </span>
  )

  return (
    <div className={styles.envDetails}>
      <table className={styles.info}>
        <tbody>
          <InfoRow title="Min Required Version" text={MIN_CLI_VERSION} />
          <InfoRow title="Max Required Version" text={MAX_CLI_VERSION} />
          <InfoRow title="Command" text={command} />
          <InfoRow title="Version" text={version || 'Not found'} />
        </tbody>
      </table>
    </div>
  )
}
