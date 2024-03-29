import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import tablesStyles from '../../styles.module.scss'
import { Icon } from '../../../../../shared/components/Icon'
import { GitMerge } from '../../../../../shared/components/icons'
import { CommitsNavigation } from '../commits/CommitsNavigation'

interface BranchDividerProps {
  branch: string
}

export const BranchDivider: React.FC<PropsWithChildren<BranchDividerProps>> = ({
  children,
  branch
}) => (
  <thead data-testid="branch-name">
    <tr className={tablesStyles.experimentsTr}>
      <th className={tablesStyles.experimentsTd}>
        <div className={styles.branchName}>
          <Icon
            className={styles.icon}
            icon={GitMerge}
            width={12}
            height={12}
          />
          {children}

          <CommitsNavigation branch={branch} />
        </div>
      </th>
      <th colSpan={9999} className={styles.branchActions}></th>
    </tr>
  </thead>
)
