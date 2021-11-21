/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { SelectMenuOption, SelectMenuOptionProps } from './SelectMenuOption'

const option: SelectMenuOptionProps = {
  id: 'a',
  isSelected: false,
  label: 'Option A'
}

const otherProps = {
  index: 2,
  onClick: jest.fn,
  selectedImage: 'some-image.svg'
}

const renderOption = (optionToRender = option, addedProps = otherProps) =>
  render(<SelectMenuOption {...optionToRender} {...addedProps} />)

afterEach(() => {
  jest.clearAllMocks()
  cleanup()
})

describe('SelectMenuOption', () => {
  it('should display the label', () => {
    renderOption()

    expect(screen.getByTestId('select-menu-option-label').innerHTML).toBe(
      option.label
    )
  })

  it('should not display an image if the option is not selected', () => {
    renderOption()

    expect(screen.queryAllByTestId('select-menu-option-check').length).toBe(0)
  })

  it('should display an image if the option is selected', () => {
    renderOption({ ...option, isSelected: true })

    expect(screen.queryAllByTestId('select-menu-option-check').length).toBe(1)
  })

  it('should call the onClick prop when clicking the option', () => {
    const onClickSpy = jest.fn()
    renderOption(option, { ...otherProps, onClick: onClickSpy })

    fireEvent(
      screen.getByTestId('select-menu-option'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    )

    expect(onClickSpy).toHaveBeenCalledTimes(1)
    expect(onClickSpy).toHaveBeenCalledWith(option.id)
  })

  it('should call the onClick prop on enter key down event', () => {
    const onClickSpy = jest.fn()
    renderOption(option, { ...otherProps, onClick: onClickSpy })

    fireEvent(
      screen.getByTestId('select-menu-option'),
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter'
      })
    )

    expect(onClickSpy).toHaveBeenCalledTimes(1)
    expect(onClickSpy).toHaveBeenCalledWith(option.id)
  })

  it('should not call the onClick prop on any other key down event', () => {
    const onClickSpy = jest.fn()
    renderOption(option, { ...otherProps, onClick: onClickSpy })

    fireEvent(
      screen.getByTestId('select-menu-option'),
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape'
      })
    )

    expect(onClickSpy).toHaveBeenCalledTimes(0)
  })
})
