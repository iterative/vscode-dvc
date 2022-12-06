import { Disposer } from '@hediet/std/disposable'
import { GetStarted } from '../../../getStarted'
import { buildDependencies } from '../util'

export const buildGetStarted = (disposer: Disposer) => {
  const { internalCommands, messageSpy, resourceLocator } =
    buildDependencies(disposer)

  const getStarted = disposer.track(
    new GetStarted('', internalCommands, resourceLocator.dvcIcon)
  )

  return {
    getStarted,
    internalCommands,
    messageSpy,
    resourceLocator
  }
}
