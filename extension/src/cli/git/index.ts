import { Command, Flag } from './constants'
import { getOptions } from './options'
import { Cli } from '..'
import { standardizePath } from '../../fileSystem/path'

export class GitCli extends Cli {
  public async getGitRepositoryRoot(cwd: string) {
    const options = getOptions({
      args: [Command.REV_PARSE, Flag.SHOW_TOPLEVEL],
      cwd
    })

    try {
      const path = await this.executeProcess(options)
      return standardizePath(path)
    } catch {}
  }
}
