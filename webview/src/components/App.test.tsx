/**
 * @jest-environment jsdom
 */
import { JSDOM } from 'jsdom'
import React from 'react'
import { render, cleanup, waitFor, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { mocked } from 'ts-jest/utils'
import { App } from './App'

import { getVsCodeApi } from '../model/VsCodeApi'
import {
  MessageFromWebviewType,
  WebviewColorTheme
} from 'dvc/src/webviewContract'

const { postMessage, getState } = getVsCodeApi()
const mockGetVsCodeApi = mocked(getVsCodeApi)
const mockPostMessage = mocked(postMessage)
const mockGetState = mocked(getState)

jest.mock('../model/VsCodeApi')

let windowSpy: any
beforeEach(() => {
  jest.clearAllMocks()

  const { window } = new JSDOM()
  windowSpy = jest.spyOn(global, 'window', 'get')
  windowSpy.mockImplementation(() => window)
  window.webviewData = {
    publicPath: 'some/path',
    theme: WebviewColorTheme.dark
  }
})

afterEach(() => {
  windowSpy.mockRestore()
  cleanup()
})

describe('App', () => {
  describe('Given an empty state', () => {
    mockGetState.mockReturnValue({})

    describe('When we render the App', () => {
      it('Then a message should be sent to the extension on the first render', () => {
        render(<App />)
        expect(mockGetVsCodeApi).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          type: MessageFromWebviewType.initialized
        })

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
      })

      it('Then the run experiment button should be displayed', async () => {
        render(<App />)
        const runExperimentButton = screen.getByText('Run Experiment')
        await waitFor(() => runExperimentButton)

        expect(runExperimentButton).toBeInTheDocument()
      })

      it('Then the empty state should be displayed', async () => {
        render(<App />)
        const emptyState = screen.getByText('Loading experiments...')
        await waitFor(() => emptyState)
        expect(emptyState).toBeInTheDocument()
      })
    })
  })
})
