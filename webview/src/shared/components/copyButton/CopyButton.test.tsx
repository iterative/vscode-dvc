/**
 * @jest-environment jsdom
 */
/* eslint-disable sonarjs/no-identical-functions */
import React from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { CopyButton } from './CopyButton'

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
    render(<CopyButton value={exampleCopyText} tooltip={defaultStateTitle} />)
    const copyButtonElement = screen.getByTitle(defaultStateTitle)

    fireEvent.click(copyButtonElement, {
      bubbles: true,
      cancelable: true
    })
    await waitFor(() => screen.findByTitle(successStateTitle))

    expect(mockWriteText).toBeCalledWith(exampleCopyText)
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(await screen.findByTitle(defaultStateTitle)).toBeInTheDocument()
  })

  it('should call writeText with the value prop and show the failure icon for a second when writeText rejects', async () => {
    mockWriteText.mockRejectedValueOnce(new Error('Copying is not allowed!'))
    render(<CopyButton value={exampleCopyText} tooltip={defaultStateTitle} />)
    const copyButtonElement = screen.getByTitle(defaultStateTitle)

    fireEvent.click(copyButtonElement, {
      bubbles: true,
      cancelable: true
    })

    await screen.findByTitle(failureStateTitle)

    expect(mockWriteText).toBeCalledWith(exampleCopyText)
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(await screen.findByTitle(defaultStateTitle)).toBeInTheDocument()
  })

  it('should restart the state reset timer if clicked while in the success state', async () => {
    mockWriteText.mockResolvedValueOnce(undefined)
    render(<CopyButton value={exampleCopyText} tooltip={defaultStateTitle} />)
    const copyButtonElement = screen.getByTitle(defaultStateTitle)

    // Click once
    fireEvent.click(copyButtonElement, {
      bubbles: true,
      cancelable: true
    })
    await screen.findByTitle(successStateTitle)

    jest.advanceTimersByTime(500)

    // Click again while still in success state
    mockWriteText.mockResolvedValueOnce(undefined)

    fireEvent.click(copyButtonElement, {
      bubbles: true,
      cancelable: true
    })
    await screen.findByTitle(successStateTitle)

    // Ensure state hasn't returned to default after it would have from the first click
    jest.advanceTimersByTime(600)
    expect(screen.getByTitle(successStateTitle)).toBeInTheDocument()
  })
})
