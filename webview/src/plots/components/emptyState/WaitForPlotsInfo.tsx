import React from 'react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import { Info } from '../../../shared/components/icons'

export const WaitForPlotsInfo: React.FC = () => (
  <p className={styles.infoText}>
    <Icon icon={Info} width={16} height={16} />
    If you have selected experiments that have just started, you might need to
    wait while plots are produced. The screen will be updated automatically if
    plots are setup correctly in this case.
  </p>
)
