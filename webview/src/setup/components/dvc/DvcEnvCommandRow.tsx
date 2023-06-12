import React from 'react'
import { useSelector } from 'react-redux'
import { DvcEnvInfoRow } from './DvcEnvInfoRow'
import styles from './styles.module.scss'
import { setupWorkspace, updatePythonEnvironment } from '../../util/messages'
import { SetupState } from '../../store'

interface DvcEnvCommandRowProps {
  command: string
}

export const DvcEnvCommandRow: React.FC<DvcEnvCommandRowProps> = ({
  command
}) => {
  const isPythonExtensionUsed = useSelector(
    (state: SetupState) => state.dvc.isPythonExtensionUsed
  )
  const commandText = command || 'Not found'
  const commandValue = (
    <>
      <span className={styles.command}>{commandText}</span>
      <span className={styles.actions}>
        <button className={styles.buttonAsLink} onClick={setupWorkspace}>
          Configure
        </button>
        {isPythonExtensionUsed && (
          <>
            <span className={styles.separator} />
            <button
              className={styles.buttonAsLink}
              onClick={updatePythonEnvironment}
            >
              Update Env
            </button>
          </>
        )}
      </span>
    </>
  )

  return <DvcEnvInfoRow title="Command" text={commandValue} />
}
