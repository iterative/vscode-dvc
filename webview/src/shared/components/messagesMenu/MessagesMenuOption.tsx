import React from 'react'
import { MessageFromWebview } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { sendMessage } from '../../vscode'

export interface MessagesMenuOptionProps {
  id: string
  label: string
  message: MessageFromWebview
}

interface MessagesMenuOptionAllProps extends MessagesMenuOptionProps {
  index: number
}

export const MessagesMenuOption: React.FC<MessagesMenuOptionAllProps> = ({
  label,
  message
}) => {
  const sendTheMessage = () => {
    sendMessage(message)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) =>
    e.key === 'Enter' && sendTheMessage()

  return (
    <div
      className={styles.item}
      onClick={sendTheMessage}
      onKeyDown={onKeyDown}
      role="menuitem"
      data-testid="messages-menu-option"
      tabIndex={0}
    >
      <div
        className={styles.itemLabel}
        data-testid="messages-menu-option-label"
      >
        {label}
      </div>
    </div>
  )
}
