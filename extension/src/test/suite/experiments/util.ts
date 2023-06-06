import { stub } from 'sinon'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/base/output'
import gitLogFixture from '../../fixtures/expShow/base/gitLog'
import rowOrderFixture from '../../fixtures/expShow/base/rowOrder'
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
import { PersistenceKey } from '../../../persistence/constants'
import { ExpShowOutput } from '../../../cli/dvc/contract'

export const DEFAULT_EXPERIMENTS_OUTPUT = {
  availableNbCommits: { main: 5 },
  expShow: expShowFixture,
  gitLog: gitLogFixture,
  rowOrder: rowOrderFixture
}

export const buildExperiments = ({
  availableNbCommits = { main: 5 },
  disposer,
  dvcRoot = dvcDemoPath,
  expShow = expShowFixture,
  gitLog = gitLogFixture,
  rowOrder = rowOrderFixture
}: {
  availableNbCommits?: { [branch: string]: number }
  disposer: Disposer
  dvcRoot?: string
  expShow?: ExpShowOutput
  gitLog?: string
  rowOrder?: { branch: string; sha: string }[]
}) => {
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
    resourceLocator
  } = buildDependencies(disposer, expShow)

  const mockUpdateExperimentsData = stub()
  const mockExperimentsData = buildMockExperimentsData(
    mockUpdateExperimentsData
  )
  const mockCheckOrAddPipeline = stub()
  const mockSelectBranches = stub().resolves(['main', 'other'])
  const mockMemento = buildMockMemento({
    [`${PersistenceKey.EXPERIMENTS_BRANCHES}${dvcRoot}`]: ['main'],
    [`${PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW}${dvcRoot}`]: {
      main: 5
    }
  })

  const experiments = disposer.track(
    new Experiments(
      dvcRoot,
      internalCommands,
      resourceLocator,
      mockMemento,
      mockCheckOrAddPipeline,
      mockSelectBranches,
      mockExperimentsData
    )
  )

  void experiments.setState({
    availableNbCommits,
    expShow,
    gitLog,
    rowOrder
  })

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
    mockSelectBranches,
    mockUpdateExperimentsData,
    resourceLocator
  }
}

export const buildMultiRepoExperiments = (disposer: SafeWatcherDisposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    gitReader,
    messageSpy,
    resourceLocator
  } = buildExperiments({
    disposer,
    dvcRoot: 'other/dvc/root',
    expShow: expShowFixture
  })

  stub(gitReader, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento(), {
      'other/dvc/root': mockExperiments
    })
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    resourceLocator
  )

  void experiments.setState(DEFAULT_EXPERIMENTS_OUTPUT)
  return { experiments, internalCommands, messageSpy, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: SafeWatcherDisposer) => {
  const { config, internalCommands, gitReader, messageSpy, resourceLocator } =
    buildDependencies(disposer)

  stub(gitReader, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(internalCommands, buildMockMemento())
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    resourceLocator
  )

  void experiments.setState(DEFAULT_EXPERIMENTS_OUTPUT)

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

  const { dvcReader, gitReader, internalCommands } =
    buildInternalCommands(disposer)
  const mockExpShow = stub(dvcReader, 'expShow').resolves(expShowFixture)
  return {
    gitReader,
    internalCommands,
    mockCreateFileSystemWatcher,
    mockExpShow
  }
}

export const buildExperimentsData = (
  disposer: SafeWatcherDisposer,
  currentBranch = 'main',
  commitOutput = gitLogFixture
) => {
  const {
    internalCommands,
    mockExpShow,
    mockCreateFileSystemWatcher,
    gitReader
  } = buildExperimentsDataDependencies(disposer)

  stub(gitReader, 'getBranches').resolves(['one'])
  stub(gitReader, 'getCurrentBranch').resolves(currentBranch)
  stub(gitReader, 'getCommitMessages').resolves(commitOutput)
  stub(gitReader, 'getNumCommits').resolves(404)

  const mockGetBranchesToShow = stub().returns(['main'])
  const mockPruneBranchesToShow = stub()
  const data = disposer.track(
    new ExperimentsData(dvcDemoPath, internalCommands, {
      getBranchesToShow: mockGetBranchesToShow,
      getNbOfCommitsToShow: () => DEFAULT_NUM_OF_COMMITS_TO_SHOW,
      pruneBranchesToShow: mockPruneBranchesToShow,
      setAvailableBranchesToShow: stub(),
      setBranchesToShow: stub()
    } as unknown as ExperimentsModel)
  )

  return {
    data,
    mockCreateFileSystemWatcher,
    mockExpShow,
    mockGetBranchesToShow,
    mockPruneBranchesToShow
  }
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
