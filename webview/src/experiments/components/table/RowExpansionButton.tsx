import React, { FC } from 'react'
import styles from './styles.module.scss'
import { RowProp } from './interfaces'
import { onClickOrEnter } from '../../../util/props'

interface ExpansionButtonIconProps {
  isExpanded: boolean
}

const ExpansionButtonIcon: FC<ExpansionButtonIconProps> = ({ isExpanded }) => (
  <span
    className={isExpanded ? styles.expandedRowArrow : styles.contractedRowArrow}
  />
)

type ExpansionButtonProps = ExpansionButtonIconProps & {
  toggleRowExpanded: () => void
}

const expansionButtonTitle = (isExpanded: boolean) =>
  `${isExpanded ? 'Contract' : 'Expand'} Row`

const ExpansionButton: FC<ExpansionButtonProps> = ({
  isExpanded,
  toggleRowExpanded
}) => (
  <button
    title={expansionButtonTitle(isExpanded)}
    className={styles.rowArrowContainer}
    {...onClickOrEnter(toggleRowExpanded)}
  >
    <ExpansionButtonIcon isExpanded={isExpanded} />
  </button>
)

type RowExpansionButtonProps = RowProp['row']

export const RowExpansionButton: FC<RowExpansionButtonProps> = ({
  isExpanded,
  toggleRowExpanded,
  canExpand
}) => {
  return canExpand ? (
    <ExpansionButton
      isExpanded={isExpanded}
      toggleRowExpanded={() => toggleRowExpanded()}
    />
  ) : (
    <span className={styles.rowArrowContainer} />
  )
}
