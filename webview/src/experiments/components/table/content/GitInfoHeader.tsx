import React from 'react'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { Info } from '../../../../shared/components/icons'
import Tooltip from '../../../../shared/components/tooltip/Tooltip'

export const GitInfoHeader: React.FC = () => (
  <div className={styles.experimentHeader}>
    <Tooltip content="The table has limited functionality while sorted. Clear all sorts to have nested rows and increase/decrease commits.">
      <span className={styles.gitInfoHeaderContents}>
        <span>Branch/Commit</span>
        <Icon icon={Info} />
      </span>
    </Tooltip>
  </div>
)
