import { window } from 'vscode'
import { Response } from './response'

export const warnOfConsequences = (
  text: string,
  ...items: Response[]
): Thenable<string | undefined> =>
  window.showWarningMessage(text, { modal: true }, ...items)

export const showInformation = (
  text: string,
  ...items: Response[]
): Thenable<string | undefined> =>
  window.showInformationMessage(text, { modal: true }, ...items)
