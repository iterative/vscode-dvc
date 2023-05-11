import React from 'react'
import { DvcCliDetails } from 'dvc/src/setup/webview/contract'
import {
  LATEST_TESTED_CLI_VERSION,
  MIN_CLI_VERSION
} from 'dvc/src/cli/dvc/contract'
import { DvcEnvInfoRow } from './DvcEnvInfoRow'
import styles from './styles.module.scss'
import { DvcEnvCommandRow } from './DvcEnvCommandRow'

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  command,
  version
}) => {
  const versionText = (
    <span>{`${
      version || 'Not found'
    } (required ${MIN_CLI_VERSION} and above, tested with ${LATEST_TESTED_CLI_VERSION})`}</span>
  )

  return (
    <table data-testid="dvc-env-details" className={styles.envDetails}>
      <tbody>
        {version && <DvcEnvCommandRow command={command} />}
        <DvcEnvInfoRow title="Version" text={versionText} />
      </tbody>
    </table>
  )
}
