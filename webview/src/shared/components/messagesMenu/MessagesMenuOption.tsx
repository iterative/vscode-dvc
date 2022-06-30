import React from 'react'
import { MessageFromWebview } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { sendMessage } from '../../vscode'

export interface MessagesMenuOptionProps {
  id: string
  label: string
  message: MessageFromWebview
  hidden?: boolean
  divider?: boolean
}

export const MessagesMenuOption: React.FC<
  MessagesMenuOptionProps & { onOptionSelected?: () => void }
> = ({ label, message, divider, onOptionSelected }) => {
  const sendTheMessage = () => {
    sendMessage(message)
    onOptionSelected?.()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) =>
    e.key === 'Enter' && sendTheMessage()

  return (
    <>
      {divider && (
        <div className={styles.dividerContainer}>
          <VSCodeDivider />
        </div>
      )}
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
    </>
  )
}
