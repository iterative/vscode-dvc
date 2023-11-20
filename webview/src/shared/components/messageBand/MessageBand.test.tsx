import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MessageBand } from './MessageBand'

describe('MessageBand', () => {
  it('should not be hidden by default', () => {
    render(<MessageBand id="test">Test</MessageBand>)

    expect(screen.getByTestId('test')).not.toHaveClass('messageBandHidden')
  })

  it('should hide the message band when the toggle button is clicked', () => {
    render(<MessageBand id="test">Test</MessageBand>)

    const toggleButton = screen.getByTestId('message-band-toggler')
    fireEvent.click(toggleButton)

    expect(screen.getByTestId('test')).toHaveClass('messageBandHidden')
  })
})
