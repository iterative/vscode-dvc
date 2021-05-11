import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { AsyncFunctionUpdatableData } from '../UpdatableData'

export class Experiments extends AsyncFunctionUpdatableData<
  ExperimentsRepoJSONOutput
> {
  private config: Config

  constructor(config: Config) {
    const getExperimentData = () =>
      experimentShow({
        pythonBinPath: this.config.pythonBinPath,
        cliPath: this.config.getCliPath(),
        cwd: this.config.workspaceRoot
      })

    super(getExperimentData)

    this.config = config
  }
}
