import { MarkdownString } from 'vscode'

export const getMarkdownString = (stringWithCodicons: string) =>
  new MarkdownString(stringWithCodicons, true)
