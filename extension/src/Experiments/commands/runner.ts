import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand
} from '../../cli/args'
import { CliRunner } from '../../cli/runner'

const runExperiment = (cliRunner: CliRunner, dvcRoot: string, ...args: Args) =>
  cliRunner.run(dvcRoot, Command.EXPERIMENT, ExperimentSubCommand.RUN, ...args)

export const run = (cliRunner: CliRunner, dvcRoot: string) =>
  runExperiment(cliRunner, dvcRoot)

export const runReset = (cliRunner: CliRunner, dvcRoot: string) =>
  runExperiment(cliRunner, dvcRoot, ExperimentFlag.RESET)

export const runQueued = (cliRunner: CliRunner, dvcRoot: string) =>
  runExperiment(cliRunner, dvcRoot, ExperimentFlag.RUN_ALL)

export const stop = (cliRunner: CliRunner) => cliRunner.stop()
