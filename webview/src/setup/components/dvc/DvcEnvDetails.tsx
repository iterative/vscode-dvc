import React, { ReactElement } from 'react'
import { DvcCliDetails } from 'dvc/src/setup/webview/contract'
import { MAX_CLI_VERSION, MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'
import { selectPythonInterpreter, setupWorkspace } from '../messages'

const InfoRow: React.FC<{
  title: string
  text: string | ReactElement
}> = ({ title, text }) => (
  <tr>
    <td className={styles.envDetailsKey}>{title}</td>
    <td className={styles.envDetailsValue}>{text}</td>
  </tr>
)

interface DvcEnvDetailsProps extends DvcCliDetails {
  isPythonExtensionInstalled: boolean
}

export const DvcEnvDetails: React.FC<DvcEnvDetailsProps> = ({
  exampleCommand,
  version,
  isPythonExtensionInstalled
}) => {
  const versionText = `${
    version || 'Not found'
  } (required >= ${MIN_CLI_VERSION} and < ${MAX_CLI_VERSION}.0.0)`
  const commandText = exampleCommand || 'Not found'
  const command = (
    <>
      <span className={styles.command}>{commandText}</span>
      <span className={styles.actions}>
        <button className={styles.buttonAsLink} onClick={setupWorkspace}>
          Configure
        </button>
        {isPythonExtensionInstalled && (
          <>
            <span className={styles.separator} />
            <button
              className={styles.buttonAsLink}
              onClick={selectPythonInterpreter}
            >
              Select Python Interpreter
            </button>
          </>
        )}
      </span>
    </>
  )

  return (
    <table data-testid="dvc-env-details" className={styles.envDetails}>
      <tbody>
        {version && <InfoRow title="Command" text={command} />}
        <InfoRow title="Version" text={versionText} />
      </tbody>
    </table>
  )
}
