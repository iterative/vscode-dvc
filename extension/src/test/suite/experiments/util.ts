import { stub } from 'sinon'
import { Uri } from 'vscode'
import { CliReader } from '../../../cli/reader'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { Config } from '../../../config'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import { ResourceLocator } from '../../../resourceLocator'
import { OutputChannel } from '../../../vscode/outputChannel'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import { buildMockMemento } from '../../util'
import { dvcDemoPath, resourcePath } from '../util'
import { WebviewColorTheme } from '../../../webview/contract'
import { ExperimentsData } from '../../../experiments/data'
import { Plots } from '../../../plots'

export const buildMockData = () =>
  ({
    dispose: stub(),
    onDidUpdate: stub()
  } as unknown as ExperimentsData)

const buildDependencies = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput
) => {
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))
  const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
    experimentShowData
  )

  const outputChannel = disposer.track(
    new OutputChannel([cliReader], '2', 'experiments test suite')
  )
  const resourceLocator = disposer.track(
    new ResourceLocator(Uri.file(resourcePath))
  )

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

export const buildPlots = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput,
  dvcRoot = dvcDemoPath
) => {
  const { config, internalCommands, resourceLocator } = buildDependencies(
    disposer,
    experimentShowData
  )

  const plots = disposer.track(
    new Plots(dvcRoot, internalCommands, resourceLocator)
  )

  plots.setState(experimentShowData)

  return {
    config,
    internalCommands,
    plots,
    resourceLocator
  }
}

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput,
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
  } = buildExperiments(disposer, complexExperimentsOutput, 'other/dvc/root')

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
  experiments.setState(complexExperimentsOutput)
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

  experiments.setState(complexExperimentsOutput)

  return { workspaceExperiments }
}

export const buildMockInternalCommands = (disposer: Disposer) => {
  const mockedInternalCommands = disposer.track(
    new InternalCommands(
      { getTheme: () => WebviewColorTheme.dark } as unknown as Config,
      {} as unknown as OutputChannel
    )
  )
  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_SHOW,
    () => Promise.resolve(complexExperimentsOutput)
  )

  return mockedInternalCommands
}
