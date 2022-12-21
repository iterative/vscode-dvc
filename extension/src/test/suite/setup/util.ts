import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import { Setup } from '../../../setup/index'
import { buildDependencies } from '../util'

export const buildSetup = (
  disposer: Disposer,
  dvInstalled = false,
  dvcInit = false,
  hasData = false
) => {
  const { messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockInitializeProject = fake()
  const mockOpenExperiments = fake()

  const mockExecuteCommand = stub(commands, 'executeCommand')

  const setup = disposer.track(
    new Setup(
      '',
      resourceLocator.dvcIcon,
      mockInitializeProject,
      mockOpenExperiments,
      () => dvInstalled,
      () => dvcInit,
      () => hasData
    )
  )

  return {
    messageSpy,
    mockExecuteCommand,
    mockInitializeProject,
    mockOpenExperiments,
    resourceLocator,
    setup
  }
}
