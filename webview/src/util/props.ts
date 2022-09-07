import React from 'react'
import { isSelecting } from './strings'

export type HandlerFunc<T> = (args?: {
  mouse?: React.MouseEvent<T, MouseEvent>
}) => void

export const clickAndEnterProps: <T>(
  handler: HandlerFunc<T>,
  textsForSelection?: string[]
) => {
  onClick: React.MouseEventHandler<T>
  onKeyDown: React.KeyboardEventHandler<T>
} = (handler, textsForSelection = []) => ({
  onClick: e => {
    e.preventDefault()
    e.stopPropagation()

    if (!isSelecting(textsForSelection)) {
      handler({ mouse: e })
    }
  },
  onKeyDown: e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Enter' || e.key === ' ') {
      handler()
    }
  }
})
