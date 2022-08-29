import { Command, Flag } from './constants'
import { getOptions } from './options'
import { Cli } from '..'

export class GitCli extends Cli {
  public getGitRepositoryRoot(cwd: string) {
    const options = getOptions(cwd, Command.REV_PARSE, Flag.SHOW_TOPLEVEL)

    return this.executeProcess(options)
  }
}
