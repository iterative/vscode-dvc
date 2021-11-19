import { MessageFromWebview } from 'dvc/src/webview/contract'
import { Model } from '../model'

export const useMessaging = (modelInstance: Model) => {
  return (message: MessageFromWebview) => modelInstance.sendMessage(message)
}
