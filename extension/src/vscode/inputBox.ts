import { window } from 'vscode'

export const getInput = (prompt: string) =>
  window.showInputBox({
    prompt
  })
