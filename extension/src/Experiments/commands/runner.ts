import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands
} from '../../cli/args'
import { CliRunner } from '../../cli/runner'

const runExperiment = (runner: CliRunner, dvcRoot: string, ...args: Args) =>
  runner.run(dvcRoot, Command.EXPERIMENT, ExperimentSubCommands.RUN, ...args)

export const run = (runner: CliRunner, dvcRoot: string) =>
  runExperiment(runner, dvcRoot)

export const runReset = (runner: CliRunner, dvcRoot: string) =>
  runExperiment(runner, dvcRoot, ExperimentFlag.RESET)

export const runQueued = (runner: CliRunner, dvcRoot: string) =>
  runExperiment(runner, dvcRoot, ExperimentFlag.RUN_ALL)

export const stop = (runner: CliRunner) => runner.stop()
