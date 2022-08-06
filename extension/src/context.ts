import { Disposable } from './class/dispose'
import { CliRunner } from './cli/runner'
import { Experiments } from './experiments'
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
          'dvc.experiments.filtered',
          repositories,
          (experiments: Experiments) => experiments.getFilters().length > 0
        )

        this.setContextFromRepositories(
          'dvc.experiments.sorted',
          repositories,
          (experiments: Experiments) => experiments.getSorts().length > 0
        )
      })
    )
  }

  private setIsExperimentRunning(repositories: Experiments[] = []) {
    const contextKey = 'dvc.experiment.running'
    if (this.cliRunner.isExperimentRunning()) {
      setContextValue(contextKey, true)
      return
    }

    this.setContextFromRepositories(
      contextKey,
      repositories,
      (experiments: Experiments) => experiments.hasRunningExperiment()
    )
  }

  private setContextFromRepositories(
    contextKey: string,
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
