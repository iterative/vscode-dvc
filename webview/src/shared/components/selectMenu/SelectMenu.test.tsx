/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen } from '@testing-library/react'
import { SelectMenu } from './SelectMenu'

const options = [
  {
    id: 'a',
    isSelected: true,
    label: 'Option A'
  },
  {
    id: 'b',
    isSelected: true,
    label: 'Option B'
  },
  {
    id: 'c',
    isSelected: false,
    label: 'Option C'
  }
]

const basicProps = {
  onClick: jest.fn,
  options,
  selectedImage: 'my-image.svg'
}

const renderMenu = (props = basicProps) => render(<SelectMenu {...props} />)

afterEach(() => {
  cleanup()
})

describe('SelectMenu', () => {
  it('should display as many options as there are options from the props', () => {
    renderMenu()

    expect(screen.queryAllByTestId('select-menu-option').length).toBe(
      options.length
    )
  })
})
