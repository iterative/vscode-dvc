import { GitCli } from '.'
import { Command, Commit, Flag } from './constants'
import { getOptions } from './options'
import { typeCheckCommands } from '..'

export const autoRegisteredCommands = {
  GIT_INIT: 'gitInit',
  GIT_RESET_WORKSPACE: 'resetWorkspace',
  GIT_STAGE_ALL: 'stageAll',
  GIT_UNSTAGE_ALL: 'reset'
} as const

export class GitExecutor extends GitCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public gitInit(cwd: string) {
    const options = getOptions({ args: [Command.INITIALIZE], cwd })

    return this.executeProcess(options)
  }

  public reset(cwd: string, ...args: (Flag | Commit)[]) {
    const options = getOptions({ args: [Command.RESET, ...args], cwd })

    return this.executeProcess(options)
  }

  public async resetWorkspace(cwd: string) {
    await this.reset(cwd, Flag.HARD, Commit.HEAD)

    const options = getOptions({
      args: [Command.CLEAN, Flag.FORCE, Flag.DIRECTORIES, Flag.QUIET],
      cwd
    })

    return this.executeProcess(options)
  }

  public async stageAll(cwd: string) {
    const gitRoot = await this.getGitRepositoryRoot(cwd)

    if (!gitRoot) {
      return
    }

    const options = getOptions({ args: [Command.ADD, Flag.DOT], cwd: gitRoot })

    return this.executeProcess(options)
  }
}
