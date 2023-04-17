import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/base/output'
import { buildMockMemento, dvcDemoPath } from '../../util'
import {
  buildDependencies,
  buildInternalCommands,
  buildMockExperimentsData,
  SafeWatcherDisposer
} from '../util'
import { ExperimentsData } from '../../../experiments/data'
import * as Watcher from '../../../fileSystem/watcher'
import { ExperimentsModel } from '../../../experiments/model'
import { ColumnsModel } from '../../../experiments/columns/model'
import { DEFAULT_NUM_OF_COMMITS_TO_SHOW } from '../../../cli/dvc/constants'

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = expShowFixture,
  dvcRoot = dvcDemoPath
) => {
  const {
    dvcExecutor,
    dvcReader,
    dvcRunner,
    dvcViewer,
    gitReader,
    internalCommands,
    messageSpy,
    mockCheckSignalFile,
    mockExpShow,
    mockGetCommitMessages,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer, experimentShowData)

  const mockUpdateExperimentsData = stub()
  const mockExperimentsData = buildMockExperimentsData(
    mockUpdateExperimentsData
  )
  const mockCheckOrAddPipeline = stub()

  const experiments = disposer.track(
    new Experiments(
      dvcRoot,
      internalCommands,
      updatesPaused,
      resourceLocator,
      buildMockMemento(),
      mockCheckOrAddPipeline,
      mockExperimentsData
    )
  )

  void experiments.setState(experimentShowData)

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,
    columnsModel: (experiments as any).columns as ColumnsModel,
    dvcExecutor,
    dvcReader,
    dvcRunner,
    dvcViewer,
    experiments,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experimentsModel: (experiments as any).experiments as ExperimentsModel,
    gitReader,
    internalCommands,
    messageSpy,
    mockCheckOrAddPipeline,
    mockCheckSignalFile,
    mockExpShow,
    mockExperimentsData,
    mockGetCommitMessages,
    mockUpdateExperimentsData,
    resourceLocator,
    updatesPaused
  }
}

export const buildMultiRepoExperiments = (disposer: SafeWatcherDisposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    gitReader,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildExperiments(disposer, expShowFixture, 'other/dvc/root')

  stub(gitReader, 'getGitRepositoryRoot').resolves(dvcDemoPath)
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

  void experiments.setState(expShowFixture)
  return { experiments, internalCommands, messageSpy, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: SafeWatcherDisposer) => {
  const {
    config,
    internalCommands,
    gitReader,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer)

  stub(gitReader, 'getGitRepositoryRoot').resolves(dvcDemoPath)
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

  void experiments.setState(expShowFixture)

  return {
    config,
    internalCommands,
    messageSpy,
    resourceLocator,
    workspaceExperiments
  }
}

const buildExperimentsDataDependencies = (disposer: Disposer) => {
  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(undefined)

  const { dvcReader, internalCommands } = buildInternalCommands(disposer)
  const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)
  return { internalCommands, mockCreateFileSystemWatcher, mockExpShow }
}

export const buildExperimentsData = (disposer: SafeWatcherDisposer) => {
  const { internalCommands, mockExpShow, mockCreateFileSystemWatcher } =
    buildExperimentsDataDependencies(disposer)

  const data = disposer.track(
    new ExperimentsData(
      dvcDemoPath,
      internalCommands,
      disposer.track(new EventEmitter<boolean>()),
      {
        getIsBranchesView: () => false,
        getNbOfCommitsToShow: () => DEFAULT_NUM_OF_COMMITS_TO_SHOW
      } as ExperimentsModel
    )
  )

  return { data, mockCreateFileSystemWatcher, mockExpShow }
}

export const stubWorkspaceExperimentsGetters = (
  dvcRoot: string,
  experiments?: Experiments
) => {
  const mockGetOnlyOrPickProject = stub(
    WorkspaceExperiments.prototype,
    'getOnlyOrPickProject'
  ).resolves(dvcRoot)
  let mockGetRepository
  if (experiments) {
    mockGetRepository = stub(
      WorkspaceExperiments.prototype,
      'getRepository'
    ).returns(experiments)
  }

  return [mockGetOnlyOrPickProject, mockGetRepository]
}
