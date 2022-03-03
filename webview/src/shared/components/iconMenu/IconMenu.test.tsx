/**
 * @jest-environment jsdom
 */
import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitForElementToBeRemoved
} from '@testing-library/react'
import { IconMenuItemProps } from './IconMenuItem'
import { IconMenu } from './IconMenu'
import { AllIcons } from '../icon/Icon'

const items: IconMenuItemProps[] = [
  {
    icon: AllIcons.PENCIL,
    onClick: jest.fn,
    tooltip: 'Rename'
  },
  {
    icon: AllIcons.UP_ARROW,
    onClick: jest.fn,
    tooltip: 'Move Up'
  },
  {
    icon: AllIcons.LINES,
    onClickNode: 'On Click Node',
    tooltip: 'Choose metrics'
  }
]

const basicProps = {
  items
}

const renderMenu = (props = basicProps) => render(<IconMenu {...props} />)

const item = {
  icon: AllIcons.PENCIL,
  onClickNode: 'Menu',
  tooltip: 'Tooltip'
}
const renderItem = (props: Partial<IconMenuItemProps> = {}) =>
  render(<IconMenu items={[{ ...item, ...props }]} />)

afterEach(() => {
  cleanup()
})

describe('IconMenu', () => {
  it('should display as many items as there are items from the props', () => {
    renderMenu()

    expect(screen.queryAllByTestId('icon-menu-item').length).toBe(items.length)
  })

  it('should display the icon', () => {
    renderItem()

    expect(screen.getByTestId('icon-menu-item-icon')).toBeInTheDocument()
  })

  it('should not display any hover menu as a natural state', () => {
    renderItem()

    expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
  })

  it('should display only the tooltip hover menu on mouse enter and hide it on mouse leave', async () => {
    renderItem()

    const item = screen.getByTestId('icon-menu-item')

    fireEvent.mouseEnter(item)

    expect(screen.getByText('Tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(item)

    await waitForElementToBeRemoved(() => screen.queryByText('Tooltip'))

    expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
  })

  it('should not show the tooltip hover menu once the onClickNode is shown', () => {
    renderItem()

    fireEvent.mouseEnter(screen.getByTestId('icon-menu-item'))

    expect(screen.getByText('Tooltip')).toBeInTheDocument()
    expect(screen.queryByText('Menu')).not.toBeInTheDocument()

    const iconMenuItem = screen.getByTestId('icon-menu-item')
    fireEvent.click(iconMenuItem)

    // Tooltip should be dismissed on first click

    expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()

    // Tooltip should not come back while menu is open

    fireEvent.mouseLeave(screen.getByTestId('icon-menu-item'))
    fireEvent.mouseEnter(screen.getByTestId('icon-menu-item'))

    expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('should do nothing on click if there are no onClick or onClickNode props', () => {
    renderItem()

    expect(() =>
      fireEvent.click(screen.getByTestId('icon-menu-item'), {
        bubbles: true,
        cancelable: true
      })
    ).not.toThrow()
  })

  it('should trigger any onClick event sent as prop on click', () => {
    const onClickSpy = jest.fn()
    renderItem({ ...item, onClick: onClickSpy })

    fireEvent.click(screen.getByTestId('icon-menu-item'), {
      bubbles: true,
      cancelable: true
    })

    expect(onClickSpy).toHaveBeenCalledTimes(1)
  })

  it('should show the onClickNode if it is present in the props', () => {
    renderItem()

    const iconMenuItem = screen.getByTestId('icon-menu-item')
    iconMenuItem.focus()
    fireEvent.click(iconMenuItem)

    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('should remove the onClickNode when clicking elsewhere', () => {
    renderItem()

    fireEvent.click(screen.getByTestId('icon-menu-item'), {
      bubbles: true,
      cancelable: true
    })

    expect(screen.getByText('Menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByText('Menu')).not.toBeInTheDocument()
  })
})
