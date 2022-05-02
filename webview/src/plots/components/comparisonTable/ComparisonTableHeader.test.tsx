/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import {
  ComparisonTableHeader,
  ComparisonTableHeaderProps
} from './ComparisonTableHeader'

describe('ComparisonTableHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const basicProps: ComparisonTableHeaderProps = {
    displayColor: '#ffffff',
    isPinned: false,
    onClicked: jest.fn()
  }
  const headerContent = 'ComparisonTableHeader'
  const fullProps = { ...basicProps, children: headerContent }
  const renderHeader = (props = fullProps) =>
    render(<ComparisonTableHeader {...props} />)

  it('should render a table header', () => {
    renderHeader()

    const header = screen.getByText(headerContent)

    expect(header).toBeInTheDocument()
  })

  it('should call the pass onClicked prop when clicking the header pin', () => {
    const onClickedSpy = jest.fn()
    renderHeader({ ...fullProps, onClicked: onClickedSpy })

    const headerPin = screen.getByRole('button')

    fireEvent.click(headerPin, {
      bubbles: true,
      cancelable: true
    })

    expect(onClickedSpy).toHaveBeenCalledTimes(1)
  })
})
