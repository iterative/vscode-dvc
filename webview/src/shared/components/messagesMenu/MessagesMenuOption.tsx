import React from 'react'
import cx from 'classnames'
import { MessageFromWebview } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { sendMessage } from '../../vscode'

export interface MessagesMenuOptionProps {
  id: string
  hideOnClick?: () => void
  label: string
  message?: MessageFromWebview
  hidden?: boolean
  divider?: boolean
  keyboardShortcut?: string
}

export const MessagesMenuOption: React.FC<
  MessagesMenuOptionProps & { onOptionSelected?: () => void }
> = ({
  label,
  message,
  hideOnClick,
  hidden,
  divider,
  onOptionSelected,
  keyboardShortcut
}) => {
  const sendTheMessage = () => {
    if (hidden) {
      return
    }
    !!message && sendMessage(message)
    onOptionSelected?.()
    hideOnClick?.()
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
        className={cx(styles.item, hidden && styles.disabled)}
        onClick={sendTheMessage}
        onKeyDown={onKeyDown}
        role="menuitem"
        data-testid="messages-menu-option"
        tabIndex={0}
      >
        <div
          className={cx(styles.itemLabel)}
          data-testid="messages-menu-option-label"
        >
          {label}
        </div>
        {keyboardShortcut && <div>{keyboardShortcut}</div>}
      </div>
    </>
  )
}
