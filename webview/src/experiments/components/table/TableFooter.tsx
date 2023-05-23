import React from 'react'
import { AddAndRemoveBranches } from './commitsAndBranches/AddAndRemoveBranches'
import styles from './styles.module.scss'

export const TableFooter: React.FC = () => (
  <tfoot className={styles.footer}>
    <tr>
      <td colSpan={99999}>
        <AddAndRemoveBranches />
      </td>
    </tr>
  </tfoot>
)
