import {
  MessageFromWebviewType,
  MessageToWebview,
  WebviewData
} from 'dvc/src/webview/contract'
import { useEffect } from 'react'
import { sendMessage } from '../vscode'

const signalInitialized = () =>
  sendMessage({ type: MessageFromWebviewType.INITIALIZED })

export function useVsCodeMessaging<T extends WebviewData>(
  handler?: (event: { data: MessageToWebview<T> }) => void
) {
  useEffect(() => {
    signalInitialized()
  }, [])
  useEffect(() => {
    handler && window.addEventListener('message', handler)
    return () => handler && window.removeEventListener('message', handler)
  }, [handler])
}
