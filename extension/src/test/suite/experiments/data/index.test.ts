import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { RelativePattern } from 'vscode'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { ensureFileSync, removeSync } from 'fs-extra'
import {
  bypassProcessManagerDebounce,
  getArgOfCall,
  getMockNow,
  getTimeSafeDisposer
} from '../../util'
import { dvcDemoPath, getTestWorkspaceFolder } from '../../../util'
import { ExperimentsData } from '../../../../experiments/data'
import * as Watcher from '../../../../fileSystem/watcher'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../../../commands/internal'
import { buildExperimentsData } from '../util'
import {
  DEFAULT_CURRENT_BRANCH_COMMITS_TO_SHOW,
  ExperimentFlag
} from '../../../../cli/dvc/constants'
import { gitPath } from '../../../../cli/git/constants'
import * as FileSystem from '../../../../fileSystem'
import { ExperimentsModel } from '../../../../experiments/model'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'
import expShowFixture from '../../../fixtures/expShow/base/output'
import { isRemoteExperimentsOutput } from '../../../../data'

const MOCK_WORKSPACE_GIT_FOLDER = join(dvcDemoPath, '.mock-git')

suite('Experiments Data Test Suite', () => {
  const disposable = getTimeSafeDisposer()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    return disposable.disposeAndFlush()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('ExperimentsData', () => {
    afterEach(() => {
      removeSync(MOCK_WORKSPACE_GIT_FOLDER)
    })

    const getDataUpdatedEvent = (data: ExperimentsData) =>
      new Promise(resolve =>
        data.onDidUpdate(data => {
          if (isRemoteExperimentsOutput(data)) {
            return
          }

          resolve(undefined)
        })
      )

    it('should debounce all calls to update that are made within 200ms', async () => {
      const { data, mockExpShow } = buildExperimentsData(disposable)
      await data.isReady()

      await Promise.all([
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate()
      ])

      expect(mockExpShow).to.be.calledOnce
    })

    it('should call the updater function on setup', async () => {
      const { data, mockCreateFileSystemWatcher, mockExpShow } =
        buildExperimentsData(disposable)

      await data.isReady()

      expect(mockExpShow).to.be.calledOnce
      expect(mockCreateFileSystemWatcher).to.be.calledOnce

      expect(getArgOfCall(mockCreateFileSystemWatcher, 0, 2)).to.deep.equal(
        new RelativePattern(getTestWorkspaceFolder(), '**')
      )
    })

    it('should watch the .git directory for updates when the directory is outside of the workspace', async () => {
      const mockNow = getMockNow()
      const gitRoot = dvcDemoPath

      const data = disposable.track(
        new ExperimentsData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: (command: CommandId) => {
              if (command === AvailableCommands.GIT_GET_BRANCHES) {
                return Promise.resolve(['main'])
              }
              if (command === AvailableCommands.GIT_GET_REPOSITORY_ROOT) {
                return Promise.resolve(gitRoot)
              }
              if (command === AvailableCommands.GIT_GET_COMMIT_MESSAGES) {
                return Promise.resolve('')
              }
              if (command === AvailableCommands.EXP_SHOW) {
                return Promise.resolve([{ rev: EXPERIMENT_WORKSPACE_ID }])
              }
              if (
                command === AvailableCommands.GIT_GET_REMOTE_EXPERIMENT_REFS
              ) {
                return Promise.resolve('')
              }
            }
          } as unknown as InternalCommands,
          {
            getBranchesToShow: () => ['main'],
            getNbOfCommitsToShow: () => ({
              main: DEFAULT_CURRENT_BRANCH_COMMITS_TO_SHOW
            }),
            setBranches: stub()
          } as unknown as ExperimentsModel,
          []
        )
      )

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = getDataUpdatedEvent(data)

      await Watcher.fireWatcher(
        FileSystem.getGitPath(gitRoot, gitPath.DOT_GIT_HEAD)
      )
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called
    }).timeout(10000)

    it('should watch the .git directory for updates when the directory is inside workspace', async () => {
      const mockNow = getMockNow()
      const gitRoot = dvcDemoPath
      const mockDotGitFilePath = join(
        MOCK_WORKSPACE_GIT_FOLDER,
        gitPath.DOT_GIT_HEAD
      )
      ensureFileSync(mockDotGitFilePath)

      stub(FileSystem, 'getGitPath').returns(MOCK_WORKSPACE_GIT_FOLDER)

      const data = disposable.track(
        new ExperimentsData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: (command: CommandId) => {
              if (command === AvailableCommands.GIT_GET_BRANCHES) {
                return Promise.resolve(['main'])
              }
              if (command === AvailableCommands.GIT_GET_REPOSITORY_ROOT) {
                return Promise.resolve(gitRoot)
              }
              if (command === AvailableCommands.GIT_GET_COMMIT_MESSAGES) {
                return Promise.resolve('')
              }
              if (command === AvailableCommands.EXP_SHOW) {
                return Promise.resolve([{ rev: EXPERIMENT_WORKSPACE_ID }])
              }
              if (
                command === AvailableCommands.GIT_GET_REMOTE_EXPERIMENT_REFS
              ) {
                return Promise.resolve('')
              }
            }
          } as unknown as InternalCommands,
          {
            getBranchesToShow: () => ['main'],
            getNbOfCommitsToShow: () => ({
              main: DEFAULT_CURRENT_BRANCH_COMMITS_TO_SHOW
            }),
            setBranches: stub()
          } as unknown as ExperimentsModel,
          []
        )
      )

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)

      const managedUpdateSpy = spy(data, 'managedUpdate')

      const dataUpdatedEvent = getDataUpdatedEvent(data)

      await Watcher.fireWatcher(mockDotGitFilePath)
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called
    }).timeout(10000)

    it('should prune any old branches to show before calling exp show on them', async () => {
      stub(ExperimentsData.prototype, 'managedUpdate').resolves()
      const branchesToShow = [
        'main',
        'my-other-branch',
        'secret-branch',
        'old-branch'
      ]
      const { data, mockSetBranches, mockGetBranchesToShow } =
        buildExperimentsData(disposable)
      mockGetBranchesToShow.returns(branchesToShow)

      await data.update()

      expect(mockSetBranches).to.be.calledOnce
    })

    it('should set experiments branches and current branch', async () => {
      const { data, mockSetBranches } = buildExperimentsData(disposable)

      await data.isReady()

      expect(mockSetBranches).to.be.calledOnceWithExactly(
        ['main', 'one'],
        ['one'],
        'main'
      )
    })

    it('should set experiments branches and current branch if user is in a detached head (no branch)', async () => {
      const { data, mockSetBranches } = buildExperimentsData(
        disposable,
        '* (no branch)'
      )

      await data.isReady()

      expect(mockSetBranches).to.be.calledOnceWithExactly(
        ['(no branch)', 'one'],
        ['one'],
        '(no branch)'
      )
    })

    it('should get the required commits from the git log output', async () => {
      stub(ExperimentsData.prototype, 'managedUpdate').resolves()
      const { data, mockExpShow, mockGetBranchesToShow } =
        buildExperimentsData(disposable)

      mockGetBranchesToShow.returns(['main'])

      await data.update()

      expect(mockExpShow).to.have.been.calledWithMatch(
        dvcDemoPath,
        ExperimentFlag.REV,
        expShowFixture[1].rev,
        ExperimentFlag.REV,
        expShowFixture[2].rev,
        ExperimentFlag.REV,
        expShowFixture[3].rev
      )
    })

    it('should get the required commits from the git log output when the user is in a detached head', async () => {
      stub(ExperimentsData.prototype, 'managedUpdate').resolves()
      const {
        data,
        mockGetBranchesToShow,
        mockGetCommitMessages,
        mockGetNumCommits
      } = buildExperimentsData(disposable, '(HEAD detached at 201a9a5)')

      mockGetBranchesToShow.returns([
        '(HEAD detached at 201a9a5)',
        'other-branch'
      ])

      await data.update()

      expect(mockGetCommitMessages).to.have.been.calledTwice
      expect(mockGetNumCommits).to.have.been.calledTwice
      expect(mockGetCommitMessages).to.have.been.calledWithExactly(
        dvcDemoPath,
        'HEAD',
        '3'
      )
      expect(mockGetCommitMessages).to.have.been.calledWithExactly(
        dvcDemoPath,
        'other-branch',
        '3'
      )
      expect(mockGetNumCommits).to.have.calledWithExactly(dvcDemoPath, 'HEAD')
      expect(mockGetNumCommits).to.have.calledWithExactly(
        dvcDemoPath,
        'other-branch'
      )
    })
  })
})
