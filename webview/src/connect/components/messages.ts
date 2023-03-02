import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const openStudio = () =>
  sendMessage({ type: MessageFromWebviewType.OPEN_STUDIO })

export const openStudioProfile = () =>
  sendMessage({ type: MessageFromWebviewType.OPEN_STUDIO_PROFILE })

export const saveStudioToken = () =>
  sendMessage({ type: MessageFromWebviewType.SAVE_STUDIO_TOKEN })

export const removeStudioToken = () =>
  sendMessage({ type: MessageFromWebviewType.REMOVE_STUDIO_TOKEN })
