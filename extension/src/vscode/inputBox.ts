import { window } from 'vscode'
import { Title } from './title'

export const getInput = (title: Title, value?: string) =>
  window.showInputBox({
    title,
    value
  })
