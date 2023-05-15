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
import { DEFAULT_NUM_OF_COMMITS_TO_SHOW } from '../../../../cli/dvc/constants'
import { EXPERIMENTS_GIT_LOGS_REFS } from '../../../../experiments/data/constants'
import { gitPath } from '../../../../cli/git/constants'
import * as FileSystem from '../../../../fileSystem'
import { ExperimentsModel } from '../../../../experiments/model'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'

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

    it('should debounce all calls to update that are made within 200ms', async () => {
      const { data, mockExpShow } = buildExperimentsData(disposable)

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
              if (command === AvailableCommands.GIT_GET_REPOSITORY_ROOT) {
                return Promise.resolve(gitRoot)
              }
              if (command === AvailableCommands.EXP_SHOW) {
                return Promise.resolve([{ rev: EXPERIMENT_WORKSPACE_ID }])
              }
            }
          } as unknown as InternalCommands,
          {
            getIsBranchesView: () => false,
            getNbOfCommitsToShow: () => DEFAULT_NUM_OF_COMMITS_TO_SHOW,
            setAvailableBranchesToShow: stub()
          } as unknown as ExperimentsModel
        )
      )

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

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
      const mockDotGitNestedFilePath = join(
        MOCK_WORKSPACE_GIT_FOLDER,
        EXPERIMENTS_GIT_LOGS_REFS,
        'index'
      )

      ensureFileSync(mockDotGitFilePath)
      ensureFileSync(mockDotGitNestedFilePath)

      stub(FileSystem, 'getGitPath').returns(MOCK_WORKSPACE_GIT_FOLDER)

      const data = disposable.track(
        new ExperimentsData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: (command: CommandId) => {
              if (command === AvailableCommands.GIT_GET_REPOSITORY_ROOT) {
                return Promise.resolve(gitRoot)
              }
              if (command === AvailableCommands.EXP_SHOW) {
                return Promise.resolve([{ rev: EXPERIMENT_WORKSPACE_ID }])
              }
            }
          } as unknown as InternalCommands,
          {
            getIsBranchesView: () => false,
            getNbOfCommitsToShow: () => DEFAULT_NUM_OF_COMMITS_TO_SHOW,
            setAvailableBranchesToShow: stub()
          } as unknown as ExperimentsModel
        )
      )

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      await Watcher.fireWatcher(mockDotGitFilePath)
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called

      await Watcher.fireWatcher(mockDotGitNestedFilePath)
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called
    }).timeout(10000)
  })
})
