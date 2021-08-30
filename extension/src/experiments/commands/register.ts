import { commands } from 'vscode'
import { pickGarbageCollectionFlags } from '../quickPick'
import { Experiments } from '..'
import { AvailableCommands } from '../../commands/internal'
import { StopWatch } from '../../util/time'
import { sendTelemetryEvent } from '../../telemetry'
import { RegisteredCommands } from '../../commands/external'

const registerCommand = (
  experiments: Experiments,
  name: RegisteredCommands,
  func: (arg?: string) => unknown
): void => {
  experiments.dispose.track(
    commands.registerCommand(name, async arg => {
      const stopWatch = new StopWatch()
      const res = await func(arg)
      sendTelemetryEvent(name, undefined, {
        duration: stopWatch.getElapsedTime()
      })
      return res
    })
  )
}

const registerExperimentCwdCommands = (experiments: Experiments): void =>
  registerCommand(experiments, RegisteredCommands.QUEUE_EXPERIMENT, () =>
    experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_QUEUE)
  )

const registerExperimentNameCommands = (experiments: Experiments): void => {
  registerCommand(experiments, RegisteredCommands.EXPERIMENT_APPLY, () =>
    experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_APPLY)
  )

  registerCommand(experiments, RegisteredCommands.EXPERIMENT_REMOVE, () =>
    experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_REMOVE)
  )
}

const registerExperimentInputCommands = (experiments: Experiments): void =>
  registerCommand(experiments, RegisteredCommands.EXPERIMENT_BRANCH, () =>
    experiments.getExpNameAndInputThenRun(
      AvailableCommands.EXPERIMENT_BRANCH,
      'Name the new branch'
    )
  )

const registerExperimentQuickPickCommands = (
  experiments: Experiments
): void => {
  registerCommand(
    experiments,
    RegisteredCommands.EXPERIMENT_GARBAGE_COLLECT,
    () =>
      experiments.getCwdAndQuickPickThenRun(
        AvailableCommands.EXPERIMENT_GARBAGE_COLLECT,
        pickGarbageCollectionFlags
      )
  )

  registerCommand(
    experiments,
    RegisteredCommands.EXPERIMENT_FILTER_ADD,
    (dvcRoot?: string) => experiments.addFilter(dvcRoot)
  )

  registerCommand(
    experiments,
    RegisteredCommands.EXPERIMENT_FILTERS_REMOVE,
    () => experiments.removeFilters()
  )

  registerCommand(
    experiments,
    RegisteredCommands.EXPERIMENT_SORT_ADD,
    (dvcRoot?: string) => experiments.addSort(dvcRoot)
  )

  registerCommand(experiments, RegisteredCommands.EXPERIMENT_SORTS_REMOVE, () =>
    experiments.removeSorts()
  )
}

const registerExperimentRunCommands = (experiments: Experiments): void => {
  registerCommand(experiments, RegisteredCommands.EXPERIMENT_RUN, () =>
    experiments.showExperimentsTableThenRun(AvailableCommands.EXPERIMENT_RUN)
  )

  registerCommand(experiments, RegisteredCommands.EXPERIMENT_RUN_RESET, () =>
    experiments.showExperimentsTableThenRun(
      AvailableCommands.EXPERIMENT_RUN_RESET
    )
  )

  registerCommand(experiments, RegisteredCommands.EXPERIMENT_RUN_QUEUED, () =>
    experiments.showExperimentsTableThenRun(
      AvailableCommands.EXPERIMENT_RUN_QUEUED
    )
  )

  registerCommand(experiments, RegisteredCommands.EXPERIMENT_SHOW, () =>
    experiments.showExperimentsTable()
  )
}

export const registerExperimentCommands = (experiments: Experiments) => {
  registerExperimentCwdCommands(experiments)
  registerExperimentNameCommands(experiments)
  registerExperimentInputCommands(experiments)
  registerExperimentQuickPickCommands(experiments)
  registerExperimentRunCommands(experiments)
}
