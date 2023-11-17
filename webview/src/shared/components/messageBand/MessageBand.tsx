import React, { PropsWithChildren, useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { Icon, IconValue } from '../Icon'
import { ChevronDown } from '../icons'

interface MessageBandProps {
  icon?: IconValue
}

export const MessageBand: React.FC<PropsWithChildren<MessageBandProps>> = ({
  children,
  icon
}) => {
  const [isUp, setIsUp] = useState(true)

  return (
    <div
      className={cx(styles.messageBand, { [styles.messageBandHidden]: !isUp })}
    >
      <button onClick={() => setIsUp(!isUp)} className={styles.toggler}>
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
