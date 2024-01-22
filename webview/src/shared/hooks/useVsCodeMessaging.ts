import {
  MessageFromWebviewType,
  MessageToWebview,
  WebviewData
} from 'dvc/src/webview/contract'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { sendMessage } from '../vscode'
import { ExperimentsDispatch } from '../../experiments/store'
import { SetupDispatch } from '../../setup/store'
import { PlotsDispatch } from '../../plots/store'

const signalInitialized = () =>
  sendMessage({ type: MessageFromWebviewType.INITIALIZED })

export function useVsCodeMessaging<T extends WebviewData>(
  feedStore: (
    data: MessageToWebview<T>,
    dispatch: PlotsDispatch | ExperimentsDispatch | SetupDispatch
  ) => void
) {
  const dispatch = useDispatch()

  const handler = useCallback(
    ({ data }: { data: MessageToWebview<T> }) => {
      feedStore(data, dispatch)
    },
    [dispatch, feedStore]
  )

  useEffect(() => {
    signalInitialized()
  }, [])
  useEffect(() => {
    handler && window.addEventListener('message', handler)
    return () => handler && window.removeEventListener('message', handler)
  }, [handler])
}
