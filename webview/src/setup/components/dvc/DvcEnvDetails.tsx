import React from 'react'
import { DvcCliDetails, DvcCliIndicator } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'

const getTextBasedOffType = (type: string, version: string | undefined) => {
  if (!version) {
    return "The extension can't find DVC."
  }

  switch (type) {
    case DvcCliIndicator.GLOBAL:
      return 'The extension is using DVC installed within a global environment.'
    case DvcCliIndicator.AUTO:
      return 'The extension is using DVC installed within a python environment selected via the Python extension.'
    case DvcCliIndicator.MANUAL:
      return 'The extension is using DVC installed within a python environment selected manually.'
  }
}

const InfoListItem: React.FC<{ title: string; text: string }> = ({
  title,
  text
}) => (
  <li>
    <span className={styles.bold}>{title}:</span> {text}
  </li>
)

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  location,
  version,
  type
}) => {
  return (
    <div className={styles.envDetails}>
      <h2 className={styles.title}>DVC CLI Info</h2>
      <p className={styles.text}>{getTextBasedOffType(type, version)}</p>
      <ul className={styles.info}>
        {version && (
          <>
            <InfoListItem title="Location" text={location} />
            <InfoListItem title="Version" text={version} />
          </>
        )}
        <InfoListItem
          title="Required Version"
          text={`${MIN_CLI_VERSION} - ${MAX_CLI_VERSION}`}
        />
      </ul>
    </div>
  )
}
