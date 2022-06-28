import React from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Ellipsis } from '../../../shared/components/icons'
import styles from '../styles.module.scss'

export const DropTarget: React.FC = () => (
  <div className={styles.dropTarget} data-testid="comparison-drop-target">
    <Icon
      icon={Ellipsis}
      className={styles.smallDropIcon}
      width={15}
      height={15}
    />
  </div>
)
