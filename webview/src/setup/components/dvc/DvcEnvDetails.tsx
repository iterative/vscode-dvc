import React from 'react'
import { DvcCliDetails, DvcCliIndicator } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'

const getLocationValue = (
  location: string,
  type: string,
  version: string | undefined
): string | undefined => {
  if (!version) {
    return undefined
  }

  switch (type) {
    case DvcCliIndicator.GLOBAL:
      return `${location} (global)`
    case DvcCliIndicator.AUTO:
      return `${location} (selected via python extension)`
    default:
      return `${location} (selected manually)`
  }
}

const InfoRow: React.FC<{ title: string; text: string | undefined }> = ({
  title,
  text
}) => (
  <tr>
    <td className={styles.infoKey}>{title}</td>
    <td className={styles.infoValue}>{text || 'Not found'}</td>
  </tr>
)

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  location,
  version,
  type
}) => {
  return (
    <div className={styles.envDetails}>
      <table className={styles.info}>
        <tbody>
          <InfoRow title="Min Required Version" text={MIN_CLI_VERSION} />
          <InfoRow title="Max Required Version" text={MAX_CLI_VERSION} />
          <InfoRow
            title="Location"
            text={getLocationValue(location, type, version)}
          />
          <InfoRow title="Version" text={version} />
        </tbody>
      </table>
    </div>
  )
}
