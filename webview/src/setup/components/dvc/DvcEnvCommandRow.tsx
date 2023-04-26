import React from 'react'
import { DvcEnvInfoRow } from './DvcEnvInfoRow'
import styles from './styles.module.scss'
import { selectPythonInterpreter, setupWorkspace } from '../messages'

interface DvcEnvCommandRowProps {
  exampleCommand: string
  isPythonExtensionInstalled: boolean
}

export const DvcEnvCommandRow: React.FC<DvcEnvCommandRowProps> = ({
  exampleCommand,
  isPythonExtensionInstalled
}) => {
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

  return <DvcEnvInfoRow title="Command" text={command} />
}
