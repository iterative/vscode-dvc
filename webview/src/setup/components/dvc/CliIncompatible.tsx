import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { checkCompatibility, upgradeDvc } from '../messages'
import { SetupState } from '../../store'

export const CliIncompatible: React.FC<PropsWithChildren> = ({ children }) => {
  const pythonBinPath = useSelector(
    (state: SetupState) => state.dvc.pythonBinPath
  )
  const canUpgrade = !!pythonBinPath

  const conditionalContents = canUpgrade ? (
    <>
      <div className={styles.sideBySideButtons}>
        <Button onClick={upgradeDvc} text="Upgrade" />
        <Button text="Check Compatibility" onClick={checkCompatibility} />
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
