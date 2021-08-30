import { Disposer } from '@hediet/std/disposable'
import { commands, Uri } from 'vscode'
import {
  RegisteredCommands,
  registerInstrumentedCommand
} from '../commands/external'

export const reRegisterVsCodeCommands = (disposer: Disposer) => {
  disposer.track(
    registerInstrumentedCommand<string>(
      RegisteredCommands.TRACKED_EXPLORER_COPY_FILE_PATH,
      path => commands.executeCommand('copyFilePath', Uri.file(path))
    )
  )

  disposer.track(
    registerInstrumentedCommand<string>(
      RegisteredCommands.TRACKED_EXPLORER_COPY_REL_FILE_PATH,
      path => commands.executeCommand('copyRelativeFilePath', Uri.file(path))
    )
  )
}
