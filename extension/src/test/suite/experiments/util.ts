import { spy, stub } from 'sinon'
import { Uri } from 'vscode'
import { CliReader } from '../../../cli/reader'
import { InternalCommands } from '../../../commands/internal'
import { Config } from '../../../config'
import { Experiments } from '../../../experiments'
import { ExperimentsRepository } from '../../../experiments/repository'
import { Disposer } from '../../../extension'
import { ResourceLocator } from '../../../resourceLocator'
import { OutputChannel } from '../../../vscode/outputChannel'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import { buildMockMemento } from '../../util'
import { dvcDemoPath, resourcePath } from '../util'

export const buildExperimentsRepository = (
  disposer: Disposer,
  experimentShowData = complexExperimentsOutput,
  dvcRoot = dvcDemoPath
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
    mockExperimentShow,
    resourceLocator
  }
}

export const buildMultiRepoExperiments = (disposer: Disposer) => {
  const {
    config,
    internalCommands,
    experimentsRepository: mockExperimentsRepository,
    resourceLocator
  } = buildExperimentsRepository(
    disposer,
    complexExperimentsOutput,
    'other/dvc/root'
  )

  const configSpy = spy(config, 'getDefaultProject')

  const experiments = disposer.track(
    new Experiments(internalCommands, buildMockMemento(), {
      'other/dvc/root': mockExperimentsRepository
    })
  )
  const [experimentsRepository] = experiments.create(
    [dvcDemoPath],
    resourceLocator
  )
  return { configSpy, experiments, experimentsRepository }
}

export const buildSingleRepoExperiments = (disposer: Disposer) => {
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))
  stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

  const outputChannel = disposer.track(
    new OutputChannel([cliReader], '4', 'experiments test suite')
  )

  const internalCommands = disposer.track(
    new InternalCommands(config, outputChannel, cliReader)
  )

  const resourceLocator = disposer.track(
    new ResourceLocator(Uri.file(resourcePath))
  )

  const experiments = disposer.track(
    new Experiments(internalCommands, buildMockMemento())
  )
  experiments.create([dvcDemoPath], resourceLocator)

  return { experiments }
}
