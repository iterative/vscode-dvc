import React from 'react'
import { useSelector } from 'react-redux'
import styles from '../styles.module.scss'
import { ExperimentsState } from '../../../store'
import { addBranches, removeBranches } from '../messages'
import { featureFlags } from '../../../../util/flags'

export const AddAndRemoveBranches: React.FC = () => {
  const { hasBranchesSelected } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  if (!featureFlags.ADD_REMOVE_BRANCHES) {
    return null
  }

  return (
    <>
      <button
        className={styles.commitsAndBranchesNavButton}
        onClick={addBranches}
      >
        Add Branch(es)
      </button>

      <button
        className={styles.commitsAndBranchesNavButton}
        onClick={removeBranches}
        disabled={!hasBranchesSelected}
      >
        Remove Branch(es)
      </button>
    </>
  )
}
