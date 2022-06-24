import React, { EventHandler, SyntheticEvent } from 'react'

export const clickAndEnterProps: <T>(handler: () => void) => {
  onClick: EventHandler<SyntheticEvent>
  onKeyDown: React.KeyboardEventHandler<T>
} = handler => ({
  onClick: e => {
    e.preventDefault()
    e.stopPropagation()
    handler()
  },
  onKeyDown: e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Enter' || e.key === ' ') {
      handler()
    }
  }
})
