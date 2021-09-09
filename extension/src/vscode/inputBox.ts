import { window } from 'vscode'

export const getInput = (prompt: string, value?: string) =>
  window.showInputBox({
    prompt,
    value
  })
