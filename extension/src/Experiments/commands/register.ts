import { commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { report } from './report'
import { getInput } from '../../vscode/inputBox'
import { getGarbageCollectionFlags } from './quickPick'
import { run, runQueued, runReset, stop } from './runner'
import { Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { CliExecutor } from '../../cli/executor'

export const getCwdThenRun = async (
  experiments: Experiments,
  func: (cwd: string) => Promise<string>
) => {
  const cwd = await experiments.getCwd()
  if (!cwd) {
    return
  }

  report(func(cwd))
}

export const getExpNameThenRun = async (
  experiments: Experiments,
  func: (cwd: string, experimentName: string) => Promise<string>
) => {
  const { cwd, name } = await experiments.getExpName()
  if (!(name && cwd)) {
    return
  }
  return report(func(cwd, name))
}

export const getExpNameAndInputThenRun = async (
  experiments: Experiments,
  func: (cwd: string, experiment: string, input: string) => Promise<string>,
  prompt: string
) => {
  const { cwd, name } = await experiments.getExpName()
  if (!(name && cwd)) {
    return
  }

  const input = await getInput(prompt)
  if (input) {
    report(func(cwd, name, input))
  }
}

export const getCwdAndQuickPickThenRun = async <T>(
  experiments: Experiments,
  func: (cwd: string, result: T) => Promise<string>,
  quickPick: () => Thenable<T | undefined>
) => {
  const cwd = await experiments.getCwd()
  if (!cwd) {
    return
  }
  const result = await quickPick()

  if (result) {
    report(func(cwd, result))
  }
}

export const registerExperimentExecutorCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
) => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      getCwdThenRun(experiments, cliExecutor.experimentRunQueue)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      getCwdAndQuickPickThenRun(
        experiments,
        cliExecutor.experimentGarbageCollect,
        getGarbageCollectionFlags
      )
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      getExpNameThenRun(experiments, cliExecutor.experimentApply)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      getExpNameAndInputThenRun(
        experiments,
        cliExecutor.experimentBranch,
        'Name the new branch'
      )
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      getExpNameThenRun(experiments, cliExecutor.experimentRemove)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      experiments.showExperimentsTable()
    )
  )

  return disposer
}

export const showExperimentsTableThenRun = async (
  experiments: Experiments,
  cliRunner: CliRunner,
  func: (cliRunner: CliRunner, dvcRoot: string) => Promise<void>
) => {
  const experimentsTable = await experiments.getExperimentsTableForCommand()
  if (!experimentsTable) {
    return
  }

  func(cliRunner, experimentsTable.getDvcRoot())
  const listener = experiments.dispose.track(
    cliRunner.onDidCompleteProcess(() => {
      experimentsTable.refresh()
      experiments.dispose.untrack(listener)
      listener.dispose()
    })
  )
}

export const registerExperimentRunnerCommands = (
  experiments: Experiments,
  cliRunner: CliRunner
): Disposable => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.runExperiment', () =>
      showExperimentsTableThenRun(experiments, cliRunner, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      showExperimentsTableThenRun(experiments, cliRunner, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      showExperimentsTableThenRun(experiments, cliRunner, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(cliRunner))
  )

  return disposer
}
