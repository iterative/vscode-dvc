import { Disposable } from './class/dispose'
import { CliRunner } from './cli/runner'
import { WorkspaceExperiments } from './experiments/workspace'
import { setContextValue } from './vscode/context'

export class Context extends Disposable {
  private readonly experiments: WorkspaceExperiments
  private readonly cliRunner: CliRunner

  constructor(experiments: WorkspaceExperiments, cliRunner: CliRunner) {
    super()

    this.experiments = experiments
    this.cliRunner = cliRunner

    this.dispose.track(
      this.cliRunner.onDidStartProcess(() => {
        this.setIsExperimentRunning()
      })
    )

    this.dispose.track(
      this.cliRunner.onDidCompleteProcess(({ cwd }) =>
        this.experiments.getRepository(cwd).update()
      )
    )

    this.dispose.track(
      this.experiments.onDidChangeExperiments(() => {
        this.setIsExperimentRunning()
      })
    )
  }

  private setIsExperimentRunning() {
    if (this.cliRunner.isExperimentRunning()) {
      setContextValue('dvc.experiment.running', true)
      return
    }

    let hasRunning = false
    for (const dvcRoot of this.experiments.getDvcRoots()) {
      if (this.experiments.getRepository(dvcRoot).hasRunningExperiment()) {
        hasRunning = true
      }
    }
    setContextValue('dvc.experiment.running', hasRunning)
  }
}
