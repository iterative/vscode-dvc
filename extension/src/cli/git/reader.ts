import { resolve } from 'path'
import { GitCli } from '.'
import { Command, Flag } from './constants'
import { getOptions } from './options'
import { typeCheckCommands } from '..'
import { trimAndSplit } from '../../util/stdout'
import { isDirectory } from '../../fileSystem'

export const autoRegisteredCommands = {
  GIT_GET_COMMIT_MESSAGES: 'getCommitMessages',
  GIT_GET_REPOSITORY_ROOT: 'getGitRepositoryRoot',
  GIT_HAS_CHANGES: 'hasChanges',
  GIT_LIST_UNTRACKED: 'listUntracked'
} as const

export class GitReader extends GitCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public async hasChanges(cwd: string) {
    const options = getOptions(
      cwd,
      Command.DIFF,
      Flag.NAME_ONLY,
      Flag.RAW_WITH_NUL
    )
    const output = await this.executeProcess(options)

    return !!output
  }

  public async getCommitMessages(cwd: string, sha: string): Promise<string> {
    const options = getOptions(
      cwd,
      Command.LOG,
      `${sha}^..HEAD`,
      Flag.PRETTY_FORMAT_COMMIT_MESSAGE,
      Flag.SEPARATE_WITH_NULL
    )
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

  private async getUntrackedDirectories(cwd: string): Promise<string[]> {
    const options = getOptions(
      cwd,
      Command.LS_FILES,
      Flag.OTHERS,
      Flag.EXCLUDE_STANDARD,
      Flag.DIRECTORY,
      Flag.NO_EMPTY_DIRECTORY
    )

    const output = await this.executeProcess(options)
    return this.getUris(cwd, trimAndSplit(output)).filter(path =>
      isDirectory(path)
    )
  }

  private async getUntrackedFiles(cwd: string): Promise<string[]> {
    const options = getOptions(
      cwd,
      Command.LS_FILES,
      Flag.OTHERS,
      Flag.EXCLUDE_STANDARD
    )

    const output = await this.executeProcess(options)
    return this.getUris(cwd, trimAndSplit(output))
  }

  private getUris(repositoryRoot: string, relativePaths: string[]) {
    return relativePaths.map(path => resolve(repositoryRoot, path))
  }
}
