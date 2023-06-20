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
import { ShowExtension } from '../remotes/ShowExtension'

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
        was not located.
      </p>
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is currently unavailable</h1>
      {children}
      {conditionalContents}
      <div className={styles.sideBySideButtons}>
        <Button
          disabled={!canInstall}
          onClick={installDvc}
          text="Install (pip)"
        />
        <Button
          disabled={!isPythonExtensionUsed}
          onClick={updatePythonEnvironment}
          text="Set Env"
        />
        <Button onClick={setupWorkspace} text="Locate DVC" />
      </div>
      {isPythonExtensionUsed || (
        <ShowExtension
          className={styles.pythonExtInfo}
          id="ms-python.python"
          name="Python"
          capabilities="detect or create python environments"
        />
      )}
    </EmptyState>
  )
}
