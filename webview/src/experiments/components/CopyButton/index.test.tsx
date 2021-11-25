/**
 * @jest-environment jsdom
 */
/* eslint-disable sonarjs/no-identical-functions */
import React from 'react'
import {
  render,
  cleanup,
  getByTitle,
  act,
  waitFor,
  findByTitle,
  fireEvent
} from '@testing-library/react'
import { CopyButton } from '.'

const mockWriteText = jest.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText
  }
})

jest.useFakeTimers()

afterEach(() => {
  cleanup()
})

describe('CopyButton', () => {
  const exampleCopyText = 'Text to Copy'
  const defaultStateTitle = 'Copy cell contents'
  const successStateTitle = 'Copy successful'
  const failureStateTitle = 'Copy failed'

  it('should call writeText with the value prop and show the success icon for a second when writeText resolves', async () => {
    mockWriteText.mockResolvedValueOnce(undefined)
    const { container } = render(<CopyButton value={exampleCopyText} />)
    const copyButtonElement = getByTitle(container, defaultStateTitle)
    await act(async () => {
      fireEvent(
        copyButtonElement,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        })
      )
      await waitFor(() => findByTitle(container, successStateTitle))
    })
    expect(mockWriteText).toBeCalledWith(exampleCopyText)
    await act(async () => {
      jest.advanceTimersByTime(1000)
      await waitFor(() =>
        expect(getByTitle(container, defaultStateTitle)).toBeDefined()
      )
    })
  })

  it('should call writeText with the value prop and show the failure icon for a second when writeText rejects', async () => {
    mockWriteText.mockRejectedValueOnce(new Error('Copying is not allowed!'))
    const { container } = render(<CopyButton value={exampleCopyText} />)
    const copyButtonElement = getByTitle(container, defaultStateTitle)
    await act(async () => {
      fireEvent(
        copyButtonElement,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        })
      )
      await waitFor(() => findByTitle(container, failureStateTitle))
    })
    expect(mockWriteText).toBeCalledWith(exampleCopyText)
    await act(async () => {
      jest.advanceTimersByTime(1000)
      await waitFor(() =>
        expect(getByTitle(container, defaultStateTitle)).toBeDefined()
      )
    })
  })

  it('should restart the state reset timer if clicked while in the success state', async () => {
    mockWriteText.mockResolvedValueOnce(undefined)
    const { container } = render(<CopyButton value={exampleCopyText} />)
    const copyButtonElement = getByTitle(container, defaultStateTitle)

    // Click once
    await act(async () => {
      fireEvent(
        copyButtonElement,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        })
      )
      await waitFor(() => findByTitle(container, successStateTitle))
    })
    jest.advanceTimersByTime(500)

    // Click again while still in success state
    mockWriteText.mockResolvedValueOnce(undefined)
    await act(async () => {
      fireEvent(
        copyButtonElement,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        })
      )
      await waitFor(() => findByTitle(container, successStateTitle))
    })

    // Ensure state hasn't returned to default after it would have from the first click
    jest.advanceTimersByTime(600)
    expect(getByTitle(container, successStateTitle)).toBeDefined()
  })
})
