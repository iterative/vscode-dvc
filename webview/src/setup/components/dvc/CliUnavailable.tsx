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
        {isPythonEnvironmentGlobal && '(Warning, not a virtual environment)'}.
      </p>
      <div className={styles.sideBySideButtons}>
        <Button onClick={installDvc} text="Install (pip)" />
        {isPythonExtensionUsed && (
          <Button onClick={updatePythonEnvironment} text="Set Env" />
        )}
        <Button onClick={setupWorkspace} text="Locate DVC" />
      </div>
    </>
  ) : (
    <>
      <p>
        {installationSentence} It can also help to install needed packages via
        pip. Unfortunately, DVC & DVCLive cannot be auto-installed as Python was
        not located.
      </p>
      <Button onClick={setupWorkspace} text="Locate DVC" />
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is currently unavailable</h1>
      {children}
      {conditionalContents}
    </EmptyState>
  )
}
