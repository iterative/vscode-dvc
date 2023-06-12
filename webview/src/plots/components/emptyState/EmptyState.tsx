import React from 'react'
import styles from './styles.module.scss'
import { CustomPlotsWrapper } from '../customPlots/CustomPlotsWrapper'
import { EmptyState as SharedEmptyState } from '../../../shared/components/emptyState/EmptyState'

export const EmptyState: React.FC<{
  hasCustomPlots: boolean
  modal: React.ReactNode
  children: React.ReactNode
}> = ({ children, hasCustomPlots, modal }) => (
  <div className={styles.emptyStateWrapper}>
    <SharedEmptyState isFullScreen={!hasCustomPlots}>
      {children}
    </SharedEmptyState>
    {hasCustomPlots && (
      <>
        <CustomPlotsWrapper />
        {modal}
      </>
    )}
  </div>
)
