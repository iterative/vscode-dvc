import React from 'react'
import { AllIcons, Icon } from '../../../shared/components/Icon'
import styles from '../styles.module.scss'

export const DropTarget: React.FC = () => (
  <div
    data-testid="plot_drop-target"
    id="plot-drop-target"
    className={styles.dropTarget}
  >
    <Icon
      icon={AllIcons.ELLIPSIS}
      className={styles.smallDropIcon}
      width={20}
      height={20}
    />
  </div>
)
