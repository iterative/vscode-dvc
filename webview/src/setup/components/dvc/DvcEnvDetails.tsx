import React from 'react'
import { DvcCliDetails, DvcCliIndicator } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'

// TBD this logic needs some improvement
// 1. that "and" statement about versioning doesn't make sense with all phrases.
// maybe just leave it as a separate sentence OR add it as an info block
// 2. The extension can't find DVC BUT will show currently selected location...
// rename to "Env Location", "Selected Env Location", "Env"? Or maybe hide
// entirely when things arent installed...
// 3. Text just needs better grammar as a whole probably
// 4. Text should mention if it's set with python extension or manually

const getTextBasedOffType = (type: string, version: string | undefined) => {
  if (!version) {
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
