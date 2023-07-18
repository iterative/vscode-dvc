import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import { Info } from '../../../shared/components/icons'

export const InfoText: React.FC<PropsWithChildren> = ({ children }) => (
  <p>
    <Icon icon={Info} width={16} height={16} className={styles.infoIcon} />{' '}
    {children}
  </p>
)
