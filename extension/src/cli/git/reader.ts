import { resolve } from 'path'
import { GitCli } from '.'
import { Command, DEFAULT_REMOTE, Flag } from './constants'
import { getOptions } from './options'
import { typeCheckCommands } from '..'
import { trimAndSplit } from '../../util/stdout'
import { isDirectory } from '../../fileSystem'

export const autoRegisteredCommands = {
  GIT_GET_BRANCHES: 'getBranches',
  GIT_GET_COMMIT_MESSAGES: 'getCommitMessages',
  GIT_GET_NUM_COMMITS: 'getNumCommits',
  GIT_GET_REMOTE_EXPERIMENT_REFS: 'getRemoteExperimentRefs',
  GIT_GET_REMOTE_URL: 'getRemoteUrl',
  GIT_GET_REPOSITORY_ROOT: 'getGitRepositoryRoot',
  GIT_HAS_CHANGES: 'hasChanges',
  GIT_HAS_NO_COMMITS: 'hasNoCommits',
  GIT_LIST_UNTRACKED: 'listUntracked',
  GIT_VERSION: 'gitVersion'
} as const

export class GitReader extends GitCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public async hasChanges(cwd: string) {
    const options = getOptions({
      args: [Command.DIFF, Flag.NAME_ONLY, Flag.RAW_WITH_NUL],
      cwd
    })
    const output = await this.executeProcess(options)

    return !!output
  }

  public async hasNoCommits(cwd: string) {
    const options = getOptions({
      args: [Command.REV_LIST, Flag.NUMBER, '1', Flag.ALL],
      cwd
    })
    try {
      const output = await this.executeProcess(options)
      return !output
    } catch {}
  }

  public async getCommitMessages(
    cwd: string,
    revision: string,
    revisions: string
  ): Promise<string> {
    const options = getOptions({
      args: [
        Command.LOG,
        revision,
        Flag.PRETTY_FORMAT_COMMIT_MESSAGE,
        Flag.RAW_WITH_NUL,
        Flag.NUMBER,
        revisions
      ],
      cwd
    })
    try {
      return await this.executeProcess(options)
    } catch {
      return ''
    }
  }

  public async getRemoteExperimentRefs(cwd: string): Promise<string> {
    const options = getOptions({
      args: [Command.LS_REMOTE, DEFAULT_REMOTE, 'refs/exps/*'],
      cwd
    })
    try {
      return await this.executeProcess(options)
    } catch {
      return ''
    }
  }

  public async getRemoteUrl(cwd: string): Promise<string> {
    const options = getOptions({ args: [Command.LS_REMOTE, Flag.GET_URL], cwd })
    try {
      return await this.executeProcess(options)
    } catch {
      return ''
    }
  }

  public async listUntracked(cwd: string) {
    const [files, dirs] = await Promise.all([
      this.getUntrackedFiles(cwd),
      this.getUntrackedDirectories(cwd)
    ])
    return new Set([...files, ...dirs])
  }

  public async getNumCommits(cwd: string, branch: string) {
    const options = getOptions({
      args: [Command.REV_LIST, Flag.COUNT, branch],
      cwd
    })
    try {
      const nbCommits = await this.executeProcess(options)
      return Number.parseInt(nbCommits)
    } catch {
      return 0
    }
  }

  public async getBranches(cwd: string): Promise<string[]> {
    const options = getOptions({
      args: [Command.BRANCH],
      cwd
    })
    try {
      const branches = await this.executeProcess(options)
      return trimAndSplit(branches)
    } catch {
      return []
    }
  }

  public async gitVersion(cwd: string) {
    try {
      const options = getOptions({ args: [Command.VERSION], cwd })
      return await this.executeProcess(getOptions(options))
    } catch {}
  }

  private async getUntrackedDirectories(cwd: string): Promise<string[]> {
    const options = getOptions({
      args: [
        Command.LS_FILES,
        Flag.OTHERS,
        Flag.EXCLUDE_STANDARD,
        Flag.DIRECTORY,
        Flag.NO_EMPTY_DIRECTORY
      ],
      cwd
    })

    const output = await this.executeProcess(options)
    return this.getUris(cwd, trimAndSplit(output)).filter(path =>
      isDirectory(path)
    )
  }

  private async getUntrackedFiles(cwd: string): Promise<string[]> {
    const options = getOptions({
      args: [Command.LS_FILES, Flag.OTHERS, Flag.EXCLUDE_STANDARD],
      cwd
    })

    const output = await this.executeProcess(options)
    return this.getUris(cwd, trimAndSplit(output))
  }

  private getUris(repositoryRoot: string, relativePaths: string[]) {
    return relativePaths.map(path => resolve(repositoryRoot, path))
  }
}
