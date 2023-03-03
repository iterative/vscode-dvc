import React, { useCallback, useState } from 'react'
import {
  MessageFromWebviewType,
  MessageToWebview
} from 'dvc/src/webview/contract'
import { ConnectData } from 'dvc/src/connect/webview/contract'
import { Studio } from './Studio'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'
import { sendMessage } from '../../shared/vscode'

export const App: React.FC = () => {
  const [isStudioConnected, setIsStudioConnected] = useState<boolean>(false)
  const [shareLiveToStudio, setShareLiveToStudioValue] =
    useState<boolean>(false)
  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<ConnectData> }) => {
        setIsStudioConnected(data.data.isStudioConnected)
        setShareLiveToStudioValue(data.data.shareLiveToStudio)
      },
      [setIsStudioConnected, setShareLiveToStudioValue]
    )
  )

  const setShareLiveToStudio = (shouldShareLive: boolean) => {
    setShareLiveToStudioValue(shouldShareLive)
    sendMessage({
      payload: shouldShareLive,
      type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
    })
  }

  return (
    <Studio
      isStudioConnected={isStudioConnected}
      shareLiveToStudio={shareLiveToStudio}
      setShareLiveToStudio={setShareLiveToStudio}
    />
  )
}
