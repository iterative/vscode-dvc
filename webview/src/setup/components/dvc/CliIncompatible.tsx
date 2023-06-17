import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { checkCompatibility, upgradeDvc } from '../../util/messages'
import { SetupState } from '../../store'

export const CliIncompatible: React.FC<PropsWithChildren> = ({ children }) => {
  const pythonBinPath = useSelector(
    (state: SetupState) => state.dvc.pythonBinPath
  )
  const canUpgrade = !!pythonBinPath

  const conditionalContents = canUpgrade ? (
    <>
      <div className={styles.sideBySideButtons}>
        <span className={styles.buttonWrapper}>
          <Button onClick={upgradeDvc} text="Upgrade (pip)" />
        </span>
        <span className={styles.buttonWrapper}>
          <Button text="Check Compatibility" onClick={checkCompatibility} />
        </span>
      </div>
    </>
  ) : (
    <>
      <p>Please update your install and try again.</p>
      <Button text="Check Compatibility" onClick={checkCompatibility} />
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <div>
        <h1>DVC is incompatible</h1>
        {children}
        {conditionalContents}
      </div>
    </EmptyState>
  )
}
