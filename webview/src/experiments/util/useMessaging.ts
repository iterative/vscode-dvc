import { MessageFromWebview } from 'dvc/src/webview/contract'
import { Model } from '../model'

export const useMessaging = () => {
  const modelInstance = Model.getInstance()
  return (message: MessageFromWebview) => modelInstance.sendMessage(message)
}
