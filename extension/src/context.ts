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
        this.setIsExperimentRunning()
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

        this.setContextFromRepositories(
          ContextKey.EXPERIMENTS_FILTERED,
          repositories,
          (experiments: Experiments) => experiments.getFilters().length > 0
        )

        this.setContextFromRepositories(
          ContextKey.EXPERIMENTS_SORTED,
          repositories,
          (experiments: Experiments) => experiments.getSorts().length > 0
        )
      })
    )
  }

  private async setIsExperimentRunning(repositories: Experiments[] = []) {
    if (this.dvcRunner.isExperimentRunning()) {
      setContextValue(ContextKey.EXPERIMENT_RUNNING, true)
      setContextValue(ContextKey.EXPERIMENT_STOPPABLE, true)
      return
    }

    this.setContextFromRepositories(
      ContextKey.EXPERIMENT_RUNNING,
      repositories,
      (experiments: Experiments) => experiments.hasRunningExperiment()
    )

    setContextValue(
      ContextKey.EXPERIMENT_STOPPABLE,
      await this.experiments.hasDvcLiveOnlyExperimentRunning()
    )
  }

  private setContextFromRepositories(
    contextKey: ContextKey,
    repositories: Experiments[],
    hasRequirement: (experiments: Experiments) => boolean
  ) {
    for (const experiments of repositories) {
      if (hasRequirement(experiments)) {
        setContextValue(contextKey, true)
        return
      }
    }
    setContextValue(contextKey, false)
  }
}
