import { stub } from 'sinon'
import { Uri } from 'vscode'
import { CliReader } from '../../../cli/reader'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { Config } from '../../../config'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import { ResourceLocator } from '../../../resourceLocator'
import { OutputChannel } from '../../../vscode/outputChannel'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import { buildMockMemento } from '../../util'
import { dvcDemoPath, resourcePath } from '../util'

const buildDependencies = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput,
  diffParamsData = {},
  diffMetricsData = {}
) => {
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))
  const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
    experimentShowData
  )
  const mockDiffParams = stub(cliReader, 'diffParams').resolves(diffParamsData)

  const mockDiffMetrics = stub(cliReader, 'diffMetrics').resolves(
    diffMetricsData
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
    mockDiffMetrics,
    mockDiffParams,
    mockExperimentShow,
    resourceLocator
  }
}

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput,
  diffParamsData = {},
  diffMetricsData = {},
  dvcRoot = dvcDemoPath
) => {
  const {
    config,
    internalCommands,
    mockExperimentShow,
    resourceLocator,
    mockDiffMetrics,
    mockDiffParams
  } = buildDependencies(
    disposer,
    experimentShowData,
    diffParamsData,
    diffMetricsData
  )

  const experiments = disposer.track(
    new Experiments(
      dvcRoot,
      internalCommands,
      resourceLocator,
      buildMockMemento()
    )
  )
  return {
    config,
    experiments,
    internalCommands,
    mockDiffMetrics,
    mockDiffParams,
    mockExperimentShow,
    resourceLocator
  }
}

export const buildMultiRepoExperiments = (disposer: Disposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    resourceLocator
  } = buildExperiments(
    disposer,
    complexExperimentsOutput,
    {},
    {},
    'other/dvc/root'
  )

  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento(), {
      'other/dvc/root': mockExperiments
    })
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    resourceLocator
  )
  return { experiments, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: Disposer) => {
  const { internalCommands, resourceLocator } = buildDependencies(disposer)

  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento())
  )
  workspaceExperiments.create([dvcDemoPath], resourceLocator)

  return { workspaceExperiments }
}

export const mockInternalCommands = () => {
  const mockedInternalCommands = new InternalCommands(
    {} as unknown as Config,
    {} as unknown as OutputChannel
  )
  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_SHOW,
    () => Promise.resolve(complexExperimentsOutput)
  )

  return mockedInternalCommands
}
