import { Header } from '@tanstack/react-table'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { createRef, useRef } from 'react'
import styles from '../styles.module.scss'

export interface ResizerHeight {
  normal: string
  hover: string
}

interface ColumnResizerProps {
  columnIsResizing: boolean
  resizerHeight: ResizerHeight
  setMenuSuppressed: (suppressed: boolean) => void
  header: Header<Experiment, unknown>
}

export const ColumnResizer: React.FC<ColumnResizerProps> = ({
  columnIsResizing,
  resizerHeight,
  setMenuSuppressed,
  header
}) => {
  const resizer = createRef<HTMLDivElement>()
  const hoveringResizer = useRef(false)

  const resetResizer = () => {
    if (resizer.current) {
      if (!columnIsResizing) {
        resizer.current.style.height = resizerHeight.normal
        return
      }
      if (hoveringResizer.current) {
        return
      }
      setTimeout(() => {
        resetResizer()
      }, 300)
    }
  }

  return (
    <div
      {...{ onMouseDown: header.getResizeHandler() }}
      ref={resizer}
      onMouseEnter={() => {
        setMenuSuppressed(true)
        hoveringResizer.current = true
        if (resizer.current) {
          resizer.current.style.height = resizerHeight.hover
        }
      }}
      onMouseLeave={() => {
        setMenuSuppressed(false)
        resetResizer()
        hoveringResizer.current = false
      }}
      className={cx(
        styles.columnResizer,
        columnIsResizing && styles.isResizing
      )}
      role="separator"
    />
  )
}
