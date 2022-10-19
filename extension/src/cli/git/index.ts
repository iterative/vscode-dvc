import { Command, Flag } from './constants'
import { getOptions } from './options'
import { Cli } from '..'
import { standardizePath } from '../../fileSystem/path'

export class GitCli extends Cli {
  public async getGitRepositoryRoot(cwd: string) {
    const options = getOptions(cwd, Command.REV_PARSE, Flag.SHOW_TOPLEVEL)

    return standardizePath(await this.executeProcess(options))
  }
}
