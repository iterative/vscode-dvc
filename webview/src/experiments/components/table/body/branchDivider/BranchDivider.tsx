import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import tablesStyles from '../../styles.module.scss'
import { Icon } from '../../../../../shared/components/Icon'
import { GitMerge } from '../../../../../shared/components/icons'
import { CommitsAndBranchesNavigation } from '../commitsAndBranches/CommitsAndBranchesNavigation'

export const BranchDivider: React.FC<PropsWithChildren> = ({ children }) => (
  <thead data-testid="branch-name">
    <tr>
      <th className={tablesStyles.experimentsTd}>
        <div className={styles.branchName}>
          <Icon
            className={styles.icon}
            icon={GitMerge}
            width={12}
            height={12}
          />
          {children}
        </div>
      </th>
      <th colSpan={9999} className={styles.branchActions}>
        <CommitsAndBranchesNavigation />
      </th>
    </tr>
  </thead>
)
