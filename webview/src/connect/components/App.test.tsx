import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { ConnectData } from 'dvc/src/connect/webview/contract'
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

const setData = ({ isStudioConnected, shareLiveToStudio }: ConnectData) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data: {
        data: {
          isStudioConnected,
          shareLiveToStudio
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
  )
}

const renderApp = (isStudioConnected = false, shareLiveToStudio = false) => {
  render(<App />)
  setData({ isStudioConnected, shareLiveToStudio })
}

describe('App', () => {
  describe('Studio not connected', () => {
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

  describe('Studio connected', () => {
    it('should render a checkbox which can be used to update dvc.studio.shareExperimentsLive', () => {
      const shareExperimentsLive = false
      renderApp(true, shareExperimentsLive)
      mockPostMessage.mockClear()
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: !shareExperimentsLive,
        type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
      })
    })
  })
})
