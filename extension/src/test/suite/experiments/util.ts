import { stub } from 'sinon'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import { ResourceLocator } from '../../../resourceLocator'
import expShowFixture from '../../fixtures/expShow/output'
import { buildMockMemento } from '../../util'
import { buildInternalCommands, dvcDemoPath, extensionUri } from '../util'
import { ExperimentsData } from '../../../experiments/data'

export const buildMockData = () =>
  ({
    dispose: stub(),
    onDidUpdate: stub()
  } as unknown as ExperimentsData)

const buildDependencies = (
  disposer: Disposer,
  experimentShowData = expShowFixture
) => {
  const { cliReader, internalCommands } = buildInternalCommands(disposer)

  const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
    experimentShowData
  )

  const resourceLocator = disposer.track(new ResourceLocator(extensionUri))

  return {
    internalCommands,
    mockExperimentShow,
    resourceLocator
  }
}

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = expShowFixture,
  dvcRoot = dvcDemoPath
) => {
  const { internalCommands, mockExperimentShow, resourceLocator } =
    buildDependencies(disposer, experimentShowData)

  const experiments = disposer.track(
    new Experiments(
      dvcRoot,
      internalCommands,
      resourceLocator,
      buildMockMemento(),
      buildMockData()
    )
  )

  experiments.setState(experimentShowData)

  return {
    experiments,
    internalCommands,
    mockExperimentShow,
    resourceLocator
  }
}

export const buildMultiRepoExperiments = (disposer: Disposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    resourceLocator
  } = buildExperiments(disposer, expShowFixture, 'other/dvc/root')

  stub(Git, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento(), {
      'other/dvc/root': mockExperiments
    })
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    resourceLocator
  )
  experiments.setState(expShowFixture)
  return { experiments, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: Disposer) => {
  const { internalCommands, resourceLocator } = buildDependencies(disposer)

  stub(Git, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento())
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    resourceLocator
  )

  experiments.setState(expShowFixture)

  return { workspaceExperiments }
}
