import { window } from 'vscode'
import { Response } from './response'

const getAcceptOrDeclineOrNever = (
  message: string,
  accept: string,
  decline: string
): Thenable<string | undefined> =>
  window.showInformationMessage(message, accept, decline, Response.NEVER)

export const getYesOrNoOrNever = (
  message: string
): Thenable<string | undefined> =>
  getAcceptOrDeclineOrNever(message, Response.YES, Response.NO)

export const getShowOrCloseOrNever = (
  message: string
): Thenable<string | undefined> =>
  getAcceptOrDeclineOrNever(message, Response.SHOW, Response.CLOSE)
