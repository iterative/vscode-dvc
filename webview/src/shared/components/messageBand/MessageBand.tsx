import React, { PropsWithChildren, useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { Icon, IconValue } from '../Icon'
import { ChevronDown } from '../icons'

interface MessageBandProps {
  id: string
  icon?: IconValue
}

export const MessageBand: React.FC<PropsWithChildren<MessageBandProps>> = ({
  children,
  icon,
  id
}) => {
  const [isUp, setIsUp] = useState(true)

  return (
    <div
      className={cx(styles.messageBand, { [styles.messageBandHidden]: !isUp })}
      data-testid={id}
    >
      <button
        onClick={() => setIsUp(!isUp)}
        className={styles.toggler}
        data-testid="message-band-toggler"
      >
        <Icon
          className={cx(styles.toggleIcon, { [styles.toggleIconDown]: !isUp })}
          icon={ChevronDown}
          width={20}
          height={20}
        />
      </button>
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
