import React, { useEffect, useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

interface HoverMenuProps {
  show?: boolean
  hideWithDelay?: boolean
}

export const HoverMenu: React.FC<HoverMenuProps> = ({
  children,
  show,
  hideWithDelay
}) => {
  const [isRemoved, setIsRemoved] = useState(!show)
  const classes = cx(styles.menu, {
    [styles.hiddenMenu]: !show && !isRemoved,
    [styles.removedMenu]: !hideWithDelay && !show
  })

  useEffect(() => {
    const delay = hideWithDelay ? 1000 : 0
    let timer: number
    if (!isRemoved && !show) {
      timer = window.setTimeout(() => setIsRemoved(true), delay)
    } else if (show) {
      setIsRemoved(false)
    }
    return () => clearTimeout(timer)
  }, [show, hideWithDelay, isRemoved])

  return (!isRemoved && <div className={classes}>{children}</div>) || null
}
