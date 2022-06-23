import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { Icon } from '../../shared/components/Icon'
import { GraphLine } from '../../shared/components/icons'

export const DropTarget: React.FC = () => (
  <div
    data-testid="plot_drop-target"
    id="plot-drop-target"
    className={cx(styles.plot, styles.dropTarget)}
  >
    <Icon icon={GraphLine} className={styles.dropIcon} width={50} height={50} />
  </div>
)
