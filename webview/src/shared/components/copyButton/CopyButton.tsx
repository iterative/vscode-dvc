import React, { useEffect, useRef, useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { Copy, Check } from '../icons'

const enum CopyButtonState {
  DEFAULT,
  SUCCESS,
  FAILURE
}

const copyIconComponents: Record<CopyButtonState, JSX.Element> = {
  [CopyButtonState.DEFAULT]: <Copy />,
  [CopyButtonState.SUCCESS]: <Check />,
  [CopyButtonState.FAILURE]: <span>&#10005;</span>
}

export const CopyButton: React.FC<{
  value: string
  tooltip?: string
  className?: string
}> = ({ value, tooltip, className }) => {
  const copyIconTitles: Record<CopyButtonState, string> = {
    [CopyButtonState.DEFAULT]: tooltip || 'Copy',
    [CopyButtonState.SUCCESS]: 'Copy successful',
    [CopyButtonState.FAILURE]: 'Copy failed'
  }

  const timer = useRef<number>()
  const [state, setState] = useState<CopyButtonState>(CopyButtonState.DEFAULT)

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
      className={cx(styles.button, className)}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
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
      {copyIconComponents[state]}
    </button>
  )
}
