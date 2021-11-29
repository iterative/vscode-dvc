import React, { FC, useEffect, useRef, useState } from 'react'
import CopyIcon from '../../../shared/components/icons/Copy'
import CheckIcon from '../../../shared/components/icons/Check'
import styles from '../Table/styles.module.scss'

const enum CopyButtonState {
  DEFAULT,
  SUCCESS,
  FAILURE
}

const FailureIcon = () => <span>&#10005;</span>

const copyIconComponents: Record<CopyButtonState, FC> = {
  [CopyButtonState.DEFAULT]: CopyIcon,
  [CopyButtonState.SUCCESS]: CheckIcon,
  [CopyButtonState.FAILURE]: FailureIcon
}

const copyIconTitles: Record<CopyButtonState, string> = {
  [CopyButtonState.DEFAULT]: 'Copy cell contents',
  [CopyButtonState.SUCCESS]: 'Copy successful',
  [CopyButtonState.FAILURE]: 'Copy failed'
}

export const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const timer = useRef<number>()
  const [state, setState] = useState<CopyButtonState>(CopyButtonState.DEFAULT)
  const IconComponent = copyIconComponents[state]
  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current)
      }
    },
    []
  )
  return (
    <button
      title={copyIconTitles[state]}
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
