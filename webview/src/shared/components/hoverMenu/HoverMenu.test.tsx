/**
 * @jest-environment jsdom
 */
import React from 'react'
import {
  render,
  cleanup,
  screen,
  waitForElementToBeRemoved
} from '@testing-library/react'
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

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should hide a menu immediately if the prop hideWithDelay is set to false', async () => {
    const { rerender } = render(
      <HoverMenu show>I will hide when you want me to</HoverMenu>
    )
    rerender(<HoverMenu>Bye!</HoverMenu>)

    await waitForElementToBeRemoved(() => screen.getByTestId('hover-menu'))

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should hide a menu with a delay if the prop hideWithDelay is set to true', () => {
    const { rerender } = render(
      <HoverMenu show hideWithDelay>
        I will stay on for a little while
      </HoverMenu>
    )
    rerender(<HoverMenu hideWithDelay>Not ready to leave yet</HoverMenu>)

    expect(screen.queryAllByTestId('hover-menu').length).toBe(1)

    jest.runOnlyPendingTimers()

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })
})
