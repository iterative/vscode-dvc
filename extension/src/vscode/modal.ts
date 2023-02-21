import { window } from 'vscode'
import { Response } from './response'

enum Level {
  ERROR = 'Error',
  INFORMATION = 'Information',
  WARNING = 'Warning'
}

export class Modal {
  public static showInformation(text: string, ...items: Response[]) {
    return Modal.show(Level.INFORMATION, text, ...items)
  }

  public static warnOfConsequences(text: string, ...items: Response[]) {
    return Modal.show(Level.WARNING, text, ...items)
  }

  public static errorWithOptions(text: string, ...items: Response[]) {
    return Modal.show(Level.ERROR, text, ...items)
  }

  private static show(
    level: Level,
    message: string,
    ...items: Response[]
  ): Thenable<Response | undefined> {
    return window[`show${level}Message`](message, { modal: true }, ...items)
  }
}
