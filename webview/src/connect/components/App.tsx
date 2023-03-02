import React, { useCallback, useState } from 'react'
import { MessageToWebview } from 'dvc/src/webview/contract'
import { ConnectData } from 'dvc/src/connect/webview/contract'
import { Studio } from './Studio'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC = () => {
  const [isStudioConnected, setIsStudioConnected] = useState<boolean>(false)
  const [shareLiveToStudio, setShareLiveToStudio] = useState<boolean>(false)
  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<ConnectData> }) => {
        setIsStudioConnected(data.data.isStudioConnected)
        setShareLiveToStudio(data.data.isStudioConnected)
      },
      [setIsStudioConnected, setShareLiveToStudio]
    )
  )

  return (
    <Studio
      isStudioConnected={isStudioConnected}
      shareLiveToStudio={shareLiveToStudio}
      setShareLiveToStudio={setShareLiveToStudio}
    />
  )
}
