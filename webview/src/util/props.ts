import React from 'react'
import { isTooltip } from './helpers'
import { isSelecting } from './strings'

export type HandlerFunc<T> = (args?: {
  mouse?: React.MouseEvent<T, MouseEvent>
}) => void

export const clickAndEnterProps: <T>(
  handler: HandlerFunc<T>,
  textsForSelection?: string[],
  checkForTooltip?: boolean
) => {
  onClick: React.MouseEventHandler<T>
  onKeyDown: React.KeyboardEventHandler<T>
} = (handler, textsForSelection = [], checkForTooltip = false) => ({
  onClick: e => {
    if (
      isSelecting(textsForSelection) ||
      (checkForTooltip && isTooltip(e.target as HTMLElement, ['BODY']))
    ) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    handler({ mouse: e })
  },
  onKeyDown: e => {
    if (e.key === 'Enter' || e.key === ' ') {
      handler()
    }
  }
})
