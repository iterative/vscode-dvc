import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import { Button } from '../../../shared/components/button/Button'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

type CliUnavailableProps = {
  installDvc: () => void
  pythonBinPath: string | undefined
  setupWorkspace: () => void
}

export const CliUnavailable: React.FC<
  PropsWithChildren<CliUnavailableProps>
> = ({ installDvc, pythonBinPath, setupWorkspace, children }) => {
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
