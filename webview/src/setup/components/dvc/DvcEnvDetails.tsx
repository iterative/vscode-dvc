import React from 'react'
import { DvcCliDetails, DvcCliIndicator } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'

const getTextBasedOffType = (type: string, version: string | undefined) => {
  if (type === DvcCliIndicator.GLOBAL && !version) {
    return "The extension can't find DVC "
  }

  if (type === DvcCliIndicator.GLOBAL) {
    return 'The extension is using DVC installed globally '
  }

  return 'The extension is using DVC installed with Python '
}

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  location,
  version,
  type
}) => {
  return (
    <div className={styles.envDetails}>
      <h2 className={styles.title}>DVC CLI Info</h2>
      <p className={styles.text}>
        {getTextBasedOffType(type, version)}
        and requires a version between {MIN_CLI_VERSION} and {MAX_CLI_VERSION}.
      </p>
      <p className={styles.info}>
        <span>Location:</span> {location}
      </p>
      {version && (
        <p className={styles.info}>
          <span>Version:</span> {version}
        </p>
      )}
    </div>
  )
}
