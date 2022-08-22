import { resolve } from 'path'
import { Command, Flag } from './constants'
import { getOptions } from './options'
import { Cli, typeCheckCommands } from '..'
import { trimAndSplit } from '../../util/stdout'
import { isDirectory } from '../../fileSystem'

export const autoRegisteredCommands = {
  GIT_HAS_CHANGES: 'hasChanges',
  GIT_LIST_UNTRACKED: 'listUntracked'
} as const

export class GitReader extends Cli {
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

  public async listUntracked(cwd: string) {
    const [files, dirs] = await Promise.all([
      this.getUntrackedFiles(cwd),
      this.getUntrackedDirectories(cwd)
    ])
    return new Set([...files, ...dirs])
  }

  private getUntrackedDirectories = async (cwd: string): Promise<string[]> => {
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

  private getUntrackedFiles = async (cwd: string): Promise<string[]> => {
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
