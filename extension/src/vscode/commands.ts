import { Disposer } from '@hediet/std/disposable'
import { commands, Uri } from 'vscode'
import {
  RegisteredCommands,
  registerInstrumentedCommand
} from '../commands/external'

const executeCommand = (name: string, path: string) =>
  commands.executeCommand(name, Uri.file(path))

export const reRegisterVsCodeCommands = (disposer: Disposer) => {
  disposer.track(
    registerInstrumentedCommand<string>(
      RegisteredCommands.TRACKED_EXPLORER_COPY_FILE_PATH,
      path => executeCommand('copyFilePath', path)
    )
  )

  disposer.track(
    registerInstrumentedCommand<string>(
      RegisteredCommands.TRACKED_EXPLORER_COPY_REL_FILE_PATH,
      path => executeCommand('copyRelativeFilePath', path)
    )
  )
}
