import React, { FC, useEffect, useRef, useState } from 'react'
import CopyIcon from '../../../shared/components/icons/Copy'
import styles from '../Table/styles.module.scss'

const enum CopyButtonState {
  DEFAULT,
  SUCCESS,
  FAILURE
}

const SuccessIcon = () => (
  <span className={styles.copySuccess} title="Copy successful">
    &#10004;
  </span>
)
const FailureIcon = () => (
  <span className={styles.copyFailed} title="Copy failed">
    &#10005;
  </span>
)

const copyIconComponents: Partial<Record<CopyButtonState, FC>> = {
  [CopyButtonState.DEFAULT]: CopyIcon,
  [CopyButtonState.SUCCESS]: SuccessIcon,
  [CopyButtonState.FAILURE]: FailureIcon
}

export const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const timer = useRef<number>()
  const [state, setState] = useState<CopyButtonState>(CopyButtonState.DEFAULT)
  const IconComponent = copyIconComponents[state] || CopyIcon
  useEffect(() => () => {
    if (timer.current) {
      window.clearTimeout(timer.current)
    }
  })
  return (
    <button
      title="Copy cell contents"
      className={styles.copyButton}
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            setState(CopyButtonState.SUCCESS)
          })
          .catch(() => {
            setState(CopyButtonState.FAILURE)
          })
          .finally(() => {
            if (timer.current) {
              window.clearTimeout(timer.current)
            }
            timer.current = window.setTimeout(() => {
              setState(CopyButtonState.DEFAULT)
            }, 1000)
          })
      }}
    >
      <IconComponent />
    </button>
  )
}
