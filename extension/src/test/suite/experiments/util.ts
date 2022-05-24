import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import omit from 'lodash.omit'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import * as Git from '../../../git'
import expShowFixture from '../../fixtures/expShow/output'
import { buildMockMemento, dvcDemoPath } from '../../util'
import {
  buildDependencies,
  buildInternalCommands,
  buildMockData,
  mockDisposable
} from '../util'
import { ExperimentsOutput } from '../../../cli/reader'
import { ExperimentsData } from '../../../experiments/data'
import { CheckpointsModel } from '../../../experiments/checkpoints/model'
import { FileSystemData } from '../../../fileSystem/data'
import * as Watcher from '../../../fileSystem/watcher'
import { ExperimentsModel } from '../../../experiments/model'
import { ColumnsModel } from '../../../experiments/columns/model'

const hasCheckpoints = (data: ExperimentsOutput) => {
  const [experimentsWithBaseline] = Object.values(omit(data, 'workspace'))
  const [firstExperiment] = Object.values(
    omit(experimentsWithBaseline, 'baseline')
  )
  const experimentFields = firstExperiment?.data

  return !!(
    experimentFields?.checkpoint_parent || experimentFields?.checkpoint_tip
  )
}

export const mockHasCheckpoints = (data: ExperimentsOutput) =>
  stub(CheckpointsModel.prototype, 'hasCheckpoints').returns(
    hasCheckpoints(data)
  )

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = expShowFixture,
  dvcRoot = dvcDemoPath
) => {
  const {
    cliExecutor,
    cliReader,
    cliRunner,
    internalCommands,
    messageSpy,
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
      buildMockData<ExperimentsData>(),
      buildMockData<FileSystemData>()
    )
  )

  mockHasCheckpoints(experimentShowData)

  experiments.setState(experimentShowData)

  return {
    cliExecutor,
    cliReader,
    cliRunner,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columnsModel: (experiments as any).columns as ColumnsModel,
    experiments,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experimentsModel: (experiments as any).experiments as ExperimentsModel,
    internalCommands,
    messageSpy,
    mockExperimentShow,
    resourceLocator,
    updatesPaused
  }
}

export const buildMultiRepoExperiments = (disposer: Disposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildExperiments(disposer, expShowFixture, 'other/dvc/root')

  stub(Git, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(
      internalCommands,
      updatesPaused,
      buildMockMemento(),
      {
        'other/dvc/root': mockExperiments
      }
    )
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    updatesPaused,
    resourceLocator
  )
  experiments.setState(expShowFixture)
  return { experiments, internalCommands, messageSpy, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: Disposer) => {
  const { internalCommands, messageSpy, updatesPaused, resourceLocator } =
    buildDependencies(disposer)

  stub(Git, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(
      internalCommands,
      updatesPaused,
      buildMockMemento()
    )
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    updatesPaused,
    resourceLocator
  )

  experiments.setState(expShowFixture)

  return { messageSpy, workspaceExperiments }
}

export const buildExperimentsDataDependencies = (disposer: Disposer) => {
  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(mockDisposable)

  const { cliReader, internalCommands } = buildInternalCommands(disposer)
  const mockExperimentShow = stub(cliReader, 'expShow').resolves(expShowFixture)
  return { internalCommands, mockCreateFileSystemWatcher, mockExperimentShow }
}

export const buildExperimentsData = (disposer: Disposer) => {
  const { internalCommands, mockExperimentShow, mockCreateFileSystemWatcher } =
    buildExperimentsDataDependencies(disposer)

  const data = disposer.track(
    new ExperimentsData(
      dvcDemoPath,
      internalCommands,
      disposer.track(new EventEmitter<boolean>())
    )
  )

  return { data, mockCreateFileSystemWatcher, mockExperimentShow }
}
