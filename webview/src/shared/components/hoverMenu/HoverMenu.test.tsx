/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen } from '@testing-library/react'
import { HoverMenu } from './HoverMenu'

afterEach(() => {
  cleanup()
})

describe('HoverMenu', () => {
  it('should display what is passed as children', () => {
    const insideText = 'I am inside the menu'
    const childrenId = 'children'
    const children = <div data-testid={childrenId}>{insideText}</div>
    render(<HoverMenu>{children}</HoverMenu>)

    expect(screen.getByTestId(childrenId).innerHTML).toBe(insideText)
  })
})
