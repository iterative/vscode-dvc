import React from 'react'
import { DvcCliDetails } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import { DvcEnvInfoRow } from './DvcEnvInfoRow'
import styles from './styles.module.scss'
import { DvcEnvCommandRow } from './DvcEnvCommandRow'

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  command,
  version
}) => {
  const versionText = `${
    version || 'Not found'
  } (${MIN_CLI_VERSION} <= required < ${MAX_CLI_VERSION}.0.0)`

  return (
    <table data-testid="dvc-env-details" className={styles.envDetails}>
      <tbody>
        {version && <DvcEnvCommandRow command={command} />}
        <DvcEnvInfoRow title="Version" text={versionText} />
      </tbody>
    </table>
  )
}
