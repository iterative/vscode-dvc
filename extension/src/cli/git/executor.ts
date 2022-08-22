import { Command, Flag } from './constants'
import { typeCheckCommands, Cli } from '..'
import { executeProcess } from '../../processExecution'
import { getGitRepositoryRoot } from '../../git'

export const autoRegisteredCommands = {
  GIT_PUSH_BRANCH: 'pushBranch',
  GIT_RESET_WORKSPACE: 'resetWorkspace',
  GIT_STAGE_ALL: 'stageAll',
  GIT_UNSTAGE_ALL: 'reset'
} as const

export class GitExecutor extends Cli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public reset(cwd: string, ...args: string[]) {
    const options = {
      args: [Command.RESET, ...args],
      cwd,
      env: process.env,
      executable: 'git'
    }

    return this.executeProcess(
      cwd,
      [options.executable, ...options.args].join(' '),
      options
    )
  }

  public async resetWorkspace(cwd: string) {
    await this.reset(cwd, Flag.HARD, 'HEAD')

    return executeProcess({
      args: [Command.CLEAN, Flag.FORCE, Flag.DIRECTORIES, Flag.QUIET],
      cwd,
      executable: 'git'
    })
  }

  public async stageAll(cwd: string) {
    const gitRoot = await getGitRepositoryRoot(cwd)

    const options = {
      args: [Command.ADD, Flag.DOT],
      cwd: gitRoot,
      env: process.env,
      executable: 'git'
    }

    return this.executeProcess(
      cwd,
      [options.executable, ...options.args].join(' '),
      options
    )
  }

  public pushBranch(cwd: string, branchName: string) {
    const options = {
      args: ['push', '-u', 'origin', branchName],
      cwd,
      env: process.env,
      executable: 'git'
    }

    return this.executeProcess(
      cwd,
      [options.executable, ...options.args].join(' '),
      options
    )
  }
}
