import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { ExperimentsState } from '../../../../store'
import { selectBranches } from '../../../../util/messages'

export const AddAndRemoveBranches: React.FC = () => {
  const { hasBranchesToSelect } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  return (
    <button
      className={styles.commitsAndBranchesNavButton}
      onClick={selectBranches}
      disabled={!hasBranchesToSelect}
    >
      Select Branch(es) to Show
    </button>
  )
}
