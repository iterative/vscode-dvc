import { stub } from 'sinon'
import { CliReader } from '../../../cli/reader'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { Config } from '../../../config'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import { ResourceLocator } from '../../../resourceLocator'
import { OutputChannel } from '../../../vscode/outputChannel'
import expShowFixture from '../../fixtures/expShow/output'
import { buildMockMemento } from '../../util'
import { dvcDemoPath, extensionUri } from '../util'
import { WebviewColorTheme } from '../../../webview/contract'
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
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))
  const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
    experimentShowData
  )

  const outputChannel = disposer.track(
    new OutputChannel([cliReader], '2', 'experiments test suite')
  )
  const resourceLocator = disposer.track(new ResourceLocator(extensionUri))

  const internalCommands = disposer.track(
    new InternalCommands(config, outputChannel, cliReader)
  )

  return {
    config,
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
  const { config, internalCommands, mockExperimentShow, resourceLocator } =
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
    config,
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

export const buildMockInternalCommands = (disposer: Disposer) => {
  const mockedInternalCommands = disposer.track(
    new InternalCommands(
      { getTheme: () => WebviewColorTheme.DARK } as unknown as Config,
      {} as unknown as OutputChannel
    )
  )
  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_SHOW,
    () => Promise.resolve(expShowFixture)
  )

  return mockedInternalCommands
}
