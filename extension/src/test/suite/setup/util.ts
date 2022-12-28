import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import { Setup } from '../../../setup/index'
import { buildDependencies } from '../util'
import * as AutoInstall from '../../../setup/autoInstall'

export const buildSetup = (
  disposer: Disposer,
  cliCompatible: boolean | undefined = undefined,
  dvcInit = false,
  hasData = false,
  gitInit = Promise.resolve(true),
  canGitInit = Promise.resolve(false)
) => {
  const { messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockInitializeDvc = fake()
  const mockInitializeGit = fake()
  const mockOpenExperiments = fake()

  const mockExecuteCommand = stub(commands, 'executeCommand')

  const mockAutoInstallDvc = stub(AutoInstall, 'autoInstallDvc')

  const setup = disposer.track(
    new Setup(
      '',
      resourceLocator.dvcIcon,
      mockInitializeDvc,
      mockInitializeGit,
      mockOpenExperiments,
      () => cliCompatible,
      () => gitInit,
      () => canGitInit,
      () => dvcInit,
      () => hasData
    )
  )

  return {
    messageSpy,
    mockAutoInstallDvc,
    mockExecuteCommand,
    mockInitializeDvc,
    mockInitializeGit,
    mockOpenExperiments,
    resourceLocator,
    setup
  }
}
