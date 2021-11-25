/**
 * @jest-environment jsdom
 */
import React from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved
} from '@testing-library/react'
import { IconMenuItem, IconMenuItemProps } from './IconMenuItem'

const item: IconMenuItemProps = {
  icon: '',
  tooltip: 'Item'
}

const otherProps = {
  canShowOnClickNode: true,
  index: 2,
  onMouseOver: jest.fn
}

const renderItem = (itemToRender = item, addedProps = otherProps) =>
  render(<IconMenuItem {...itemToRender} {...addedProps} />)

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllMocks()
  cleanup()
})

describe('IconMenuItem', () => {
  it('should display the icon', () => {
    renderItem()

    expect(screen.queryAllByTestId('icon-menu-item-icon').length).toBe(1)
  })

  it('should not display any hover menu as a natural state', () => {
    renderItem()

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should display only the tooltip hover menu on mouse enter and hide it on mouse leave', async () => {
    renderItem()

    fireEvent.mouseEnter(screen.getByTestId('icon-menu-item'))

    const hoverMenu = await screen.getByTestId('hover-menu')

    expect(screen.queryAllByTestId('hover-menu').length).toBe(1)
    expect(hoverMenu.innerHTML).toBe(item.tooltip)

    fireEvent.mouseLeave(screen.getByTestId('icon-menu-item'))

    await waitForElementToBeRemoved(() => screen.getByTestId('hover-menu'))

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should call the onMouseOver prop when the mouse enters the item', () => {
    const onMouseOverSpy = jest.fn()
    renderItem(item, { ...otherProps, onMouseOver: onMouseOverSpy })

    fireEvent.mouseEnter(screen.getByTestId('icon-menu-item'))

    expect(onMouseOverSpy).toHaveBeenCalledTimes(1)
  })

  it('should not show the tooltip hover menu if the icon has been clicked', () => {
    renderItem()

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new MouseEvent('mouseEnter', {
        bubbles: true,
        cancelable: true
      })
    )

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    )

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should do nothing on click if there are no onClick or onClickNode props', () => {
    renderItem()

    expect(() =>
      fireEvent(
        screen.getByTestId('icon-menu-item'),
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        })
      )
    ).not.toThrow()
  })

  it('should trigger any onClick event sent as prop on click', () => {
    const onClickSpy = jest.fn()
    renderItem({ ...item, onClick: onClickSpy })

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    )

    expect(onClickSpy).toHaveBeenCalledTimes(1)
  })

  it('should show the onClickNode if it is present in the props', async () => {
    const onClickNode = 'Something'
    renderItem({ ...item, onClickNode })

    screen.getByTestId('icon-menu-item').focus()
    fireEvent.click(screen.getByTestId('icon-menu-item'))

    const hoverMenu = await screen.getByTestId('hover-menu')

    expect(screen.queryAllByTestId('hover-menu').length).toBe(1)
    expect(hoverMenu.innerHTML).toBe(onClickNode)
  })

  it('should remove the onClickNode on blur', () => {
    const onClickNode = 'Something'
    renderItem({ ...item, onClickNode })

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    )

    fireEvent.blur(screen.getByTestId('icon-menu-item'))

    act(() => {
      jest.advanceTimersByTime(1500)
    })

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should remove the onClickNode if the prop canShowOnClickNode is set to false', () => {
    const onClickNode = 'Something'
    const { rerender } = renderItem({ ...item, onClickNode })

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    )

    rerender(
      <IconMenuItem {...item} {...otherProps} canShowOnClickNode={false} />
    )

    jest.runOnlyPendingTimers()

    expect(screen.queryAllByTestId('hover-menu').length).toBe(0)
  })

  it('should call the onClick prop on enter key down event', () => {
    const onClickSpy = jest.fn()
    renderItem({ ...item, onClick: onClickSpy })

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter'
      })
    )

    expect(onClickSpy).toHaveBeenCalledTimes(1)
  })

  it('should not call the onClick prop on any other key down event', () => {
    const onClickSpy = jest.fn()
    renderItem({ ...item, onClick: onClickSpy })

    fireEvent(
      screen.getByTestId('icon-menu-item'),
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape'
      })
    )

    expect(onClickSpy).toHaveBeenCalledTimes(0)
  })
})
