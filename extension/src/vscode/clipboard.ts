import { env } from 'vscode'
import { Toast } from './toast'

const { clipboard } = env

export const writeToClipboard = async (
  text: string,
  message?: string
): Promise<void> => {
  await clipboard.writeText(text)
  void Toast.infoWithOptions(`${message || text} copied to clipboard`)
}
