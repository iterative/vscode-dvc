import { window } from 'vscode'
import { Title } from './title'

export const getInput = (title: Title, value?: string) =>
  window.showInputBox({
    title,
    value
  })

export const getValidInput = (
  title: Title,
  validateInput: (text?: string) => null | string,
  value?: string
) =>
  window.showInputBox({
    title,
    validateInput,
    value
  })
