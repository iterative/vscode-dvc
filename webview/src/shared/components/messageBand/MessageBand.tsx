import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'
import { Icon, IconValue } from '../Icon'

interface MessageBandProps {
  id: string
  icon?: IconValue
}

export const MessageBand: React.FC<PropsWithChildren<MessageBandProps>> = ({
  children,
  icon,
  id
}) => {
  return (
    <div className={styles.messageBand} data-testid={id}>
      {icon && (
        <Icon
          className={styles.messageBandIcon}
          icon={icon}
          width={50}
          height={50}
        />
      )}
      <div>{children}</div>
    </div>
  )
}
