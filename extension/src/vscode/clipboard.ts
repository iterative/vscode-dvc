import { env } from 'vscode'
import { Toast } from './toast'

const { clipboard } = env

export const writeToClipboard = async (text: string): Promise<void> => {
  await clipboard.writeText(text)
  void Toast.infoWithOptions(`${text} copied to clipboard`)
}
