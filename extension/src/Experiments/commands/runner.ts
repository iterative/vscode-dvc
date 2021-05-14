import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands
} from '../../cli/args'
import { Runner } from '../../cli/Runner'

const runExperiment = (runner: Runner, dvcRoot: string, ...args: Args) =>
  runner.run(dvcRoot, Command.EXPERIMENT, ExperimentSubCommands.RUN, ...args)

export const run = (runner: Runner, dvcRoot: string) =>
  runExperiment(runner, dvcRoot)

export const runReset = (runner: Runner, dvcRoot: string) =>
  runExperiment(runner, dvcRoot, ExperimentFlag.RESET)

export const runQueued = (runner: Runner, dvcRoot: string) =>
  runExperiment(runner, dvcRoot, ExperimentFlag.RUN_ALL)

export const stop = (runner: Runner) => runner.stop()
