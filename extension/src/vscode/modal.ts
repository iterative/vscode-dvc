import { window } from 'vscode'
import { Response } from './response'

export const warnOfConsequences = (
  text: string,
  ...items: Response[]
): Thenable<string | undefined> =>
  window.showWarningMessage(text, { modal: true }, ...items)
