import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'

jest.mock('../../shared/api')
jest.mock('../../util/styles')

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

const renderApp = () => {
  return render(<App />)
}

describe('App', () => {
  it('should show three buttons which walk the user through saving a token', async () => {
    renderApp()
    const buttons = await screen.findAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('should show a button which opens Studio', () => {
    renderApp()
    mockPostMessage.mockClear()
    const button = screen.getByText('Sign In')
    fireEvent.click(button)
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.OPEN_STUDIO
    })
  })

  it("should show a button which opens the user's Studio profile", () => {
    renderApp()
    mockPostMessage.mockClear()
    const button = screen.getByText('Get Token')
    fireEvent.click(button)
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.OPEN_STUDIO_PROFILE
    })
  })

  it("should show a button which allows the user's to save their Studio access token", () => {
    renderApp()
    mockPostMessage.mockClear()
    const button = screen.getByText('Save')
    fireEvent.click(button)
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
    })
  })
})
