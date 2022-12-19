import { Disposer } from '@hediet/std/disposable'
import { fake } from 'sinon'
import { GetStarted } from '../../../getStarted'
import { buildDependencies } from '../util'

export const buildGetStarted = (disposer: Disposer, dvInstalled = false) => {
  const { messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockInitializeProject = fake()
  const mockOpenExperiments = fake()

  const getStarted = disposer.track(
    new GetStarted(
      '',
      resourceLocator.dvcIcon,
      mockInitializeProject,
      mockOpenExperiments,
      () => dvInstalled,
      () => false,
      () => false
    )
  )

  return {
    getStarted,
    messageSpy,
    mockInitializeProject,
    mockOpenExperiments,
    resourceLocator
  }
}
