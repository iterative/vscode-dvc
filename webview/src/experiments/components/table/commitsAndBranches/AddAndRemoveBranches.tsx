import React from 'react'
import { useSelector } from 'react-redux'
import styles from '../styles.module.scss'
import { ExperimentsState } from '../../../store'
import { selectBranches } from '../messages'
import { featureFlag } from '../../../../util/flags'

export const AddAndRemoveBranches: React.FC = () => {
  const { hasBranchesToSelect } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  if (!featureFlag.ADD_REMOVE_BRANCHES) {
    return null
  }

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
