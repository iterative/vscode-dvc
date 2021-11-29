/**
 * @jest-environment jsdom
 */
import React from 'react'
import {
  act,
  cleanup,
  render,
  screen,
  waitForElementToBeRemoved
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { HoverMenu } from './HoverMenu'

beforeEach(() => jest.useFakeTimers())

afterEach(() => {
  cleanup()
})

describe('HoverMenu', () => {
  it('should display what is passed as children', () => {
    const insideText = 'I am inside the menu'
    const childrenId = 'children'
    const children = <div data-testid={childrenId}>{insideText}</div>
    render(<HoverMenu show>{children}</HoverMenu>)

    expect(screen.getByTestId(childrenId).innerHTML).toBe(insideText)
  })

  it('should display nothing if the prop show is not on the component', () => {
    render(<HoverMenu>Never seen</HoverMenu>)

    expect(screen.queryByTestId('hover-menu')).not.toBeInTheDocument()
  })

  it('should hide a menu immediately if the prop hideWithDelay is set to false', async () => {
    const { rerender } = render(
      <HoverMenu show>I will hide when you want me to</HoverMenu>
    )
    rerender(<HoverMenu>Bye!</HoverMenu>)

    await waitForElementToBeRemoved(() => screen.queryByTestId('hover-menu'))

    expect(screen.queryByTestId('hover-menu')).not.toBeInTheDocument()
  })

  it('should hide a menu with a delay if the prop hideWithDelay is set to true', () => {
    const { rerender } = render(
      <HoverMenu show hideWithDelay>
        I will stay on for a little while
      </HoverMenu>
    )
    rerender(<HoverMenu hideWithDelay>Not ready to leave yet</HoverMenu>)

    expect(screen.getByTestId('hover-menu')).toBeInTheDocument()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(screen.queryByTestId('hover-menu')).not.toBeInTheDocument()
  })
})
