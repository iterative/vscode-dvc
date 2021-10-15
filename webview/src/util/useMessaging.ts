import { MessageFromWebview } from 'dvc/src/experiments/webview/contract'
import { isStorybook } from './storybook'
import { Model } from '../model'

export const useMessaging = () => {
  if (!isStorybook) {
    const modelInstance = Model.getInstance()
    return (message: MessageFromWebview) => modelInstance.sendMessage(message)
  }
  return () => {}
}
