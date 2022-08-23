import { GitCli } from '.'
import { Args, Command, Commit, DEFAULT_REMOTE, Flag } from './constants'
import { getOptions } from './options'
import { typeCheckCommands } from '..'

export const autoRegisteredCommands = {
  GIT_PUSH_BRANCH: 'pushBranch',
  GIT_RESET_WORKSPACE: 'resetWorkspace',
  GIT_STAGE_ALL: 'stageAll',
  GIT_STAGE_AND_COMMIT: 'stageAndCommit',
  GIT_UNSTAGE_ALL: 'reset'
} as const

export class GitExecutor extends GitCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public pushBranch(cwd: string, branchName?: string) {
    const args: Args = [Command.PUSH, Flag.SET_UPSTREAM, DEFAULT_REMOTE]

    args.push((branchName || Commit.HEAD) as Commit)

    const options = getOptions(cwd, ...args)

    return this.executeProcess(options)
  }

  public reset(cwd: string, ...args: (Flag | Commit)[]) {
    const options = getOptions(cwd, Command.RESET, ...args)

    return this.executeProcess(options)
  }

  public async resetWorkspace(cwd: string) {
    await this.reset(cwd, Flag.HARD, Commit.HEAD)

    const options = getOptions(
      cwd,
      Command.CLEAN,
      Flag.FORCE,
      Flag.DIRECTORIES,
      Flag.QUIET
    )

    return this.executeProcess(options)
  }

  public async stageAll(cwd: string) {
    const gitRoot = await this.getGitRepositoryRoot(cwd)
    const options = getOptions(gitRoot, Command.ADD, Flag.DOT)

    return this.executeProcess(options)
  }

  public async stageAndCommit(cwd: string, message: string) {
    await this.stageAll(cwd)

    const args = [Command.COMMIT, Flag.MESSAGE, message] as Args
    const options = getOptions(cwd, ...args)

    return this.executeProcess(options)
  }
}
