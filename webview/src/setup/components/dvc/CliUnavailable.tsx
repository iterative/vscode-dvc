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

  const contents = canInstall ? (
    <>
      <p>
        DVC & DVCLive can be auto-installed as packages with {pythonBinPath}
      </p>
      <div className={styles.sideBySideButtons}>
        <Button onClick={installDvc} text="Install" />
        <Button onClick={setupWorkspace} text="Configure" />
      </div>
    </>
  ) : (
    <>
      <p>DVC & DVCLive cannot be auto-installed as Python was not located.</p>
      <Button onClick={setupWorkspace} text="Configure" />
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is currently unavailable</h1>
      {children}
      {contents}
    </EmptyState>
  )
}
