import { stub } from 'sinon'
import { Uri } from 'vscode'
import { CliReader } from '../../../cli/reader'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { Config } from '../../../config'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { ExperimentsRepository } from '../../../experiments'
import { Disposer } from '../../../extension'
import { ResourceLocator } from '../../../resourceLocator'
import { OutputChannel } from '../../../vscode/outputChannel'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import { buildMockMemento } from '../../util'
import { dvcDemoPath, resourcePath } from '../util'

const buildDependencies = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput
) => {
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))
  const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
    experimentShowData
  )
  const mockDiffParams = stub(cliReader, 'diffParams').resolves({
    'params.yaml': {}
  })

  const mockDiffMetrics = stub(cliReader, 'diffMetrics').resolves({
    metrics: {}
  })

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

export const buildExperimentsRepository = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput,
  dvcRoot = dvcDemoPath
) => {
  const {
    config,
    internalCommands,
    mockExperimentShow,
    resourceLocator,
    mockDiffMetrics,
    mockDiffParams
  } = buildDependencies(disposer, experimentShowData)

  const experimentsRepository = disposer.track(
    new ExperimentsRepository(
      dvcRoot,
      internalCommands,
      resourceLocator,
      buildMockMemento()
    )
  )
  return {
    config,
    experimentsRepository,
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
    experimentsRepository: mockExperimentsRepository,
    resourceLocator
  } = buildExperimentsRepository(
    disposer,
    complexExperimentsOutput,
    'other/dvc/root'
  )

  const experiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento(), {
      'other/dvc/root': mockExperimentsRepository
    })
  )
  const [experimentsRepository] = experiments.create(
    [dvcDemoPath],
    resourceLocator
  )
  return { experiments, experimentsRepository }
}

export const buildSingleRepoExperiments = (disposer: Disposer) => {
  const { internalCommands, resourceLocator } = buildDependencies(disposer)

  const experiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento())
  )
  experiments.create([dvcDemoPath], resourceLocator)

  return { experiments }
}

export const mockInternalCommands = () => {
  const mockedInternalCommands = new InternalCommands(
    {
      getDefaultProject: stub()
    } as unknown as Config,
    {} as unknown as OutputChannel
  )
  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_SHOW,
    () => Promise.resolve(complexExperimentsOutput)
  )

  return mockedInternalCommands
}
