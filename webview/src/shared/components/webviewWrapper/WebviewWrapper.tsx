import React, { ReactNode } from 'react'
import cx from 'classnames'
import { useThemeVariables } from './useThemeVariables'
import styles from './styles.module.scss'

export const WebviewWrapper = ({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) => {
  const themeVariables = useThemeVariables()

  return (
    <div
      className={cx(styles.webviewWrapper, className)}
      style={themeVariables}
      onContextMenu={e => {
        e.preventDefault()
      }}
    >
      {children}
    </div>
  )
}
