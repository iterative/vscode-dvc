import { act, fireEvent } from '@testing-library/react'

export const pickAndMove = (
  node: HTMLElement,
  xDifference = 0,
  yDifference = 0,
  cancel?: boolean
) => {
  const startingPositionX = xDifference >= 0 ? 0 : -xDifference
  const startingPositionY = yDifference >= 0 ? 0 : -yDifference

  act(() => {
    fireEvent.mouseDown(node, {
      clientX: startingPositionX,
      clientY: startingPositionY
    })
  })
  if (cancel) {
    fireEvent.keyDown(node, { key: 'Escape' })
  }
  act(() => {
    fireEvent.mouseMove(node, {
      clientX: xDifference,
      clientY: yDifference
    })
  })

  act(() => {
    fireEvent.mouseUp(node)
  })
}
