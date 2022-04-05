import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../shared/components/Icon'

export const DropTarget: React.FC = () => (
  <div className={cx(styles.plot, styles.dropTarget)}>
    <Icon
      icon={AllIcons.GRAPH_LINE}
      className={styles.dropIcon}
      width={50}
      height={50}
    />
  </div>
)
