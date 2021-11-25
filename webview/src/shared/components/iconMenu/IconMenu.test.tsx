/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen } from '@testing-library/react'
import { IconMenuItemProps } from './IconMenuItem'
import { IconMenu } from './IconMenu'

const items: IconMenuItemProps[] = [
  {
    icon: 'pencil',
    onClick: jest.fn,
    tooltip: 'Rename'
  },
  {
    icon: 'upArrow',
    onClick: jest.fn,
    tooltip: 'Move Up'
  },
  {
    icon: 'lines',
    onClickNode: 'On Click Node',
    tooltip: 'Choose metrics'
  }
]

const basicProps = {
  items
}

const renderMenu = (props = basicProps) => render(<IconMenu {...props} />)

afterEach(() => {
  cleanup()
})

describe('IconMenu', () => {
  it('should display as many items as there are items from the props', () => {
    renderMenu()

    expect(screen.queryAllByTestId('icon-menu-item').length).toBe(items.length)
  })
})
