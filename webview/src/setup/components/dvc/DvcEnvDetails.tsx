import React from 'react'
import { DvcCliDetails } from 'dvc/src/setup/webview/contract'
import {
  LATEST_TESTED_CLI_VERSION,
  MIN_CLI_VERSION
} from 'dvc/src/cli/dvc/contract'
import { DvcEnvInfoRow } from './DvcEnvInfoRow'
import styles from './styles.module.scss'
import { DvcEnvCommandRow } from './DvcEnvCommandRow'

interface DvcEnvDetailsProps extends DvcCliDetails {
  isPythonExtensionUsed: boolean
}

export const DvcEnvDetails: React.FC<DvcEnvDetailsProps> = ({
  command,
  version,
  isPythonExtensionUsed
}) => {
  const versionText = (
    <>
      <span>{`${
        version || 'Not found'
      } (required >= ${MIN_CLI_VERSION})`}</span>
      <span>{`Extension has been tested on versions up to ${LATEST_TESTED_CLI_VERSION}.`}</span>
    </>
  )

  return (
    <table data-testid="dvc-env-details" className={styles.envDetails}>
      <tbody>
        {version && (
          <DvcEnvCommandRow
            isPythonExtensionUsed={isPythonExtensionUsed}
            command={command}
          />
        )}
        <DvcEnvInfoRow title="Version" text={versionText} />
      </tbody>
    </table>
  )
}
