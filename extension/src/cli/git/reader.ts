import { Cli, typeCheckCommands } from '..'

export const autoRegisteredCommands = {
  GIT_PUSH: 'push',
  GIT_RESET: 'reset',
  GIT_RESET_WORKSPACE: 'resetWorkspace',
  GIT_STAGE_ALL: 'stageAll'
} as const

export class GitReader extends Cli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )
}
