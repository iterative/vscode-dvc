import React, { ReactNode } from 'react'
import { useThemeVariables } from './useThemeVariables'
import styles from './styles.module.scss'

export const WebviewWrapper = ({ children }: { children: ReactNode }) => {
  const themeVariables = useThemeVariables()

  return (
    <div
      className={styles.webviewWrapper}
      style={themeVariables}
      onContextMenu={e => {
        e.preventDefault()
      }}
    >
      {children}
    </div>
  )
}
