import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import { GetStarted } from '../../../getStarted'
import { buildDependencies } from '../util'

export const buildGetStarted = (disposer: Disposer, dvInstalled = false) => {
  const { messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockInitializeProject = fake()
  const mockOpenExperiments = fake()

  const mockExecuteCommand = stub(commands, 'executeCommand')

  const getStarted = disposer.track(
    new GetStarted(
      '',
      resourceLocator.dvcIcon,
      mockInitializeProject,
      mockOpenExperiments,
      () => dvInstalled,
      () => false,
      () => false,
      () => undefined
    )
  )

  return {
    getStarted,
    messageSpy,
    mockExecuteCommand,
    mockInitializeProject,
    mockOpenExperiments,
    resourceLocator
  }
}
