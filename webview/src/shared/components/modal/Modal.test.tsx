/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  afterEach(() => {
    cleanup()
  })

  it('should call the onClose prop when pressing Escape', () => {
    const onClose = jest.fn()

    render(<Modal onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('should not call the onClose prop when pressing other keys', () => {
    const onClose = jest.fn()

    render(<Modal onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: 'e' })
    fireEvent.keyDown(window, { key: 'Space' })
    fireEvent.keyDown(window, { key: 'Alt' })

    expect(onClose).not.toHaveBeenCalled()
  })
})
