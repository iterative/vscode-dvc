import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import tablesStyles from '../../styles.module.scss'
import { Icon } from '../../../../../shared/components/Icon'
import { GitMerge } from '../../../../../shared/components/icons'

export const BranchDivider: React.FC<PropsWithChildren> = ({ children }) => (
  <tbody>
    <tr>
      <td className={tablesStyles.experimentsTd}>
        <div className={styles.branchName}>
          <Icon
            className={styles.icon}
            icon={GitMerge}
            width={12}
            height={12}
          />
          {children}
        </div>
      </td>
    </tr>
  </tbody>
)
