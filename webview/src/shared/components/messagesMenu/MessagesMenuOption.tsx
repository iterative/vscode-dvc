import React from 'react'
import cx from 'classnames'
import { MessageFromWebview } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { sendMessage } from '../../vscode'

export interface MessagesMenuOptionProps {
  id: string
  label: string
  message?: MessageFromWebview
  disabled?: boolean
  divider?: boolean
  keyboardShortcut?: string
}

export const MessagesMenuOption: React.FC<
  MessagesMenuOptionProps & { onOptionSelected?: () => void }
> = ({
  label,
  message,
  disabled,
  divider,
  onOptionSelected,
  keyboardShortcut
}) => {
  const sendTheMessage = () => {
    if (disabled) {
      return
    }
    !!message && sendMessage(message)
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
        aria-disabled={disabled}
        className={cx(styles.item, disabled && styles.disabledItem)}
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
        {keyboardShortcut && <div>{keyboardShortcut}</div>}
      </div>
    </>
  )
}
