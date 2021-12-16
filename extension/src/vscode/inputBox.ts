import { window } from 'vscode'

export const getInput = (title: string, value?: string) =>
  window.showInputBox({
    title,
    value
  })
