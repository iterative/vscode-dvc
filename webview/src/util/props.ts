import React from 'react'

export type HandlerFunc<T> = (args?: {
  mouse?: React.MouseEvent<T, MouseEvent>
}) => void

export const clickAndEnterProps: <T>(handler: HandlerFunc<T>) => {
  onClick: React.MouseEventHandler<T>
  onKeyDown: React.KeyboardEventHandler<T>
} = handler => ({
  onClick: e => {
    e.preventDefault()
    e.stopPropagation()
    handler({ mouse: e })
  },
  onKeyDown: e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Enter' || e.key === ' ') {
      handler()
    }
  }
})
