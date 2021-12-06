import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import { ResourceLocator } from '../../../resourceLocator'
import expShowFixture from '../../fixtures/expShow/output'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { buildInternalCommands, extensionUri } from '../util'
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

  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  const resourceLocator = disposer.track(new ResourceLocator(extensionUri))

  return {
    internalCommands,
    mockExperimentShow,
    resourceLocator,
    updatesPaused
  }
}

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = expShowFixture,
  dvcRoot = dvcDemoPath
) => {
  const {
    internalCommands,
    mockExperimentShow,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer, experimentShowData)

  const experiments = disposer.track(
    new Experiments(
      dvcRoot,
      internalCommands,
      updatesPaused,
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
    resourceLocator,
    updatesPaused
  }
}

export const buildMultiRepoExperiments = (disposer: Disposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    updatesPaused,
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
    updatesPaused,
    resourceLocator
  )
  experiments.setState(expShowFixture)
  return { experiments, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: Disposer) => {
  const { internalCommands, updatesPaused, resourceLocator } =
    buildDependencies(disposer)

  stub(Git, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento())
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    updatesPaused,
    resourceLocator
  )

  experiments.setState(expShowFixture)

  return { workspaceExperiments }
}
