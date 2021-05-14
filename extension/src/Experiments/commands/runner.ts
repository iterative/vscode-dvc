import { Experiments } from '..'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands
} from '../../cli/args'
import { Runner } from '../../cli/Runner'

const runExperiment = async (
  runner: Runner,
  experiments: Experiments,
  ...args: Args
) => {
  await experiments.showWebview()
  runner.run(
    experiments.getDvcRoot(),
    Command.EXPERIMENT,
    ExperimentSubCommands.RUN,
    ...args
  )
  const listener = runner.onDidCompleteProcess(() => {
    experiments.refresh()
    listener.dispose()
  })
  return listener
}

export const run = (runner: Runner, experiments: Experiments) =>
  runExperiment(runner, experiments)

export const runReset = (runner: Runner, experiments: Experiments) =>
  runExperiment(runner, experiments, ExperimentFlag.RESET)

export const runQueued = (runner: Runner, experiments: Experiments) =>
  runExperiment(runner, experiments, ExperimentFlag.RUN_ALL)
