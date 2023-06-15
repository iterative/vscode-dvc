import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { Button } from '../../../shared/components/button/Button'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { SetupState } from '../../store'
import {
  installDvc,
  setupWorkspace,
  updatePythonEnvironment
} from '../../util/messages'
import { Warning } from '../../../shared/components/icons'
import { ExtensionLink } from '../shared/ExtensionLink'
import Tooltip from '../../../shared/components/tooltip/Tooltip'

const PythonExtensionTooltip: React.FC<
  PropsWithChildren<{ disabled: boolean }>
> = ({ disabled, children }) => (
  <Tooltip
    content={
      <span>
        Install the{' '}
        <ExtensionLink extensionId="ms-python.python">
          Python extension
        </ExtensionLink>
        .
      </span>
    }
    interactive={true}
    disabled={disabled}
  >
    <span>{children}</span>
  </Tooltip>
)

export const CliUnavailable: React.FC<PropsWithChildren> = ({ children }) => {
  const { pythonBinPath, isPythonExtensionUsed, isPythonEnvironmentGlobal } =
    useSelector((state: SetupState) => state.dvc)
  const canInstall = !!pythonBinPath
  const installationSentence = (
    <>
      The extension supports all{' '}
      <a href="https://dvc.org/doc/install">installation types</a>.
    </>
  )

  const conditionalContents = canInstall ? (
    <>
      <p>
        {installationSentence} Auto-install (pip) DVC & DVCLive with{' '}
        {pythonBinPath}{' '}
        {isPythonEnvironmentGlobal && (
          <>
            (<Warning className={styles.inlineWarningSvg} />{' '}
            <span>Not a virtual environment)</span>
          </>
        )}
        .
      </p>
    </>
  ) : (
    <>
      <p>
        {installationSentence} DVC & DVCLive cannot be auto-installed as Python
        was not located. Install the{' '}
        <ExtensionLink extensionId="ms-python.python">
          Python extension
        </ExtensionLink>{' '}
        to detect or create python environments.
      </p>
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is currently unavailable</h1>
      {children}
      {conditionalContents}
      <div className={styles.sideBySideButtons}>
        <PythonExtensionTooltip disabled={canInstall}>
          <Button
            disabled={!canInstall}
            onClick={installDvc}
            text="Install (pip)"
          />
        </PythonExtensionTooltip>
        <PythonExtensionTooltip disabled={isPythonExtensionUsed}>
          <Button
            disabled={!isPythonExtensionUsed}
            onClick={updatePythonEnvironment}
            text="Set Env"
          />
        </PythonExtensionTooltip>
        <Button onClick={setupWorkspace} text="Locate DVC" />
      </div>
    </EmptyState>
  )
}
