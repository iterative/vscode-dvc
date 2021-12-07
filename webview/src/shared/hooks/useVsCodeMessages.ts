import {
  MessageFromWebviewType,
  MessageToWebview,
  WebviewData
} from 'dvc/src/webview/contract'
import { useEffect } from 'react'
import { vsCodeApi } from '../api'

const signalInitialized = () =>
  vsCodeApi.postMessage({ type: MessageFromWebviewType.INITIALIZED })

export function useVsCodeMessages<T extends WebviewData>(
  handler: (event: { data: MessageToWebview<T> }) => void
) {
  useEffect(() => {
    signalInitialized()
  }, [])
  useEffect(() => {
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [handler])
}
