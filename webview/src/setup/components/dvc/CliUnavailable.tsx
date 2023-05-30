import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { Button } from '../../../shared/components/button/Button'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { SetupState } from '../../store'
import { installDvc, setupWorkspace } from '../messages'

export const CliUnavailable: React.FC<PropsWithChildren> = ({ children }) => {
  const pythonBinPath = useSelector(
    (state: SetupState) => state.dvc.pythonBinPath
  )
  const canInstall = !!pythonBinPath
  const installationSentence = (
    <>
      The extension supports all{' '}
      <a href="https://dvc.org/doc/install">installation types</a> and can
      auto-install recommended packages for you.
    </>
  )

  const conditionalContents = canInstall ? (
    <>
      <p>
        {installationSentence} DVC & DVCLive can be auto-installed with{' '}
        {pythonBinPath}.
      </p>
      <div className={styles.sideBySideButtons}>
        <Button onClick={installDvc} text="Install" />
        <Button onClick={setupWorkspace} text="Configure" />
      </div>
    </>
  ) : (
    <>
      <p>
        {installationSentence} Unfortunately, DVC & DVCLive cannot be
        auto-installed as Python was not located.
      </p>
      <Button onClick={setupWorkspace} text="Configure" />
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is currently unavailable</h1>
      {children}
      <p>
        New to DVC? Check out <a href="https://dvc.org/">dvc.org</a> to learn
        more or our{' '}
        <a href="https://github.com/iterative/vscode-dvc-demo">demo</a> to
        quickly try the extension.{' '}
      </p>
      {conditionalContents}
    </EmptyState>
  )
}
