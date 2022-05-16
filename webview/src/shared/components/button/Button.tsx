import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import React from 'react'
import styles from './styles.module.scss'

export type ButtonProps = {
  appearance?: 'primary' | 'secondary'
  onClick: () => void
  text: string
  isNested?: boolean
  children?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  appearance,
  children,
  onClick,
  text,
  isNested
}: ButtonProps) => {
  return (
    <VSCodeButton
      appearance={appearance}
      onClick={onClick}
      className={isNested && styles.secondaryButton}
    >
      {text}
      {children}
    </VSCodeButton>
  )
}
