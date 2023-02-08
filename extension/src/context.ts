import { Disposable } from './class/dispose'
import { DvcRunner } from './cli/dvc/runner'
import { Experiments } from './experiments'
import { WorkspaceExperiments } from './experiments/workspace'
import { ContextKey, setContextValue } from './vscode/context'

export class Context extends Disposable {
  private readonly experiments: WorkspaceExperiments
  private readonly dvcRunner: DvcRunner

  constructor(experiments: WorkspaceExperiments, dvcRunner: DvcRunner) {
    super()

    this.experiments = experiments
    this.dvcRunner = dvcRunner

    this.dispose.track(
      this.dvcRunner.onDidStartProcess(() => {
        void this.setIsExperimentRunning()
      })
    )

    this.dispose.track(
      this.dvcRunner.onDidCompleteProcess(({ cwd }) =>
        this.experiments.getRepository(cwd).update()
      )
    )

    this.onDidChangeExperiments()
  }

  private onDidChangeExperiments() {
    this.dispose.track(
      this.experiments.onDidChangeExperiments(() => {
        const repositories: Experiments[] = []
        for (const dvcRoot of this.experiments.getDvcRoots()) {
          repositories.push(this.experiments.getRepository(dvcRoot))
        }

        this.setIsExperimentRunning(repositories)

        void setContextValue(
          ContextKey.EXPERIMENTS_FILTERED,
          repositories.some(experiments => experiments.getFilters().length > 0)
        )

        void setContextValue(
          ContextKey.EXPERIMENTS_SORTED,
          repositories.some(experiments => experiments.getSorts().length > 0)
        )
      })
    )
  }

  private setIsExperimentRunning(repositories: Experiments[] = []) {
    void setContextValue(
      ContextKey.EXPERIMENT_RUNNING,
      this.dvcRunner.isExperimentRunning() ||
        repositories.some(experiments => experiments.hasRunningExperiment())
    )
  }
}
