import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { AsyncFunctionUpdatableData } from '../UpdatableData'

export class Experiments extends AsyncFunctionUpdatableData<
  ExperimentsRepoJSONOutput
> {
  private config: Config

  constructor(config: Config) {
    super(() =>
      experimentShow({
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.getCliPath(),
        cwd: this.config.workspaceRoot
      })
    )
    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
  }
}
