import { Disposable, Disposer } from '@hediet/std/disposable'
import { Experiments } from '.'
import { WorkspaceExperiments } from './workspace'
import { quickPickManyValues, quickPickOne } from '../vscode/quickPick'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { getInput, getValidInput } from '../vscode/inputBox'
import { buildMockMemento } from '../test/util'
import { buildMockedEventEmitter } from '../test/util/jest'
import { OutputChannel } from '../vscode/outputChannel'
import { Title } from '../vscode/title'

const mockedShowWebview = jest.fn()
const mockedDisposable = jest.mocked(Disposable)
const mockedDvcRoot = '/my/dvc/root'
const mockedOtherDvcRoot = '/my/fun/dvc/root'
const mockedQuickPickOne = jest.mocked(quickPickOne)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)
const mockedGetValidInput = jest.mocked(getValidInput)
const mockedPickCommitOrExperiment = jest.fn()
const mockedGetInput = jest.mocked(getInput)
const mockedRun = jest.fn()
const mockedExpFunc = jest.fn()
const mockedListStages = jest.fn()
const mockedGetBranches = jest.fn()
const mockedExpBranch = jest.fn()

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../vscode/quickPick')
jest.mock('../vscode/inputBox')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('Experiments', () => {
  mockedDisposable.fn.mockReturnValue({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)

  const mockedInternalCommands = new InternalCommands({
    show: jest.fn()
  } as unknown as OutputChannel)

  const mockedCommandId = 'mockedExpFunc' as CommandId
  mockedInternalCommands.registerCommand(mockedCommandId, (...args) =>
    mockedExpFunc(...args)
  )

  mockedInternalCommands.registerCommand(
    AvailableCommands.EXPERIMENT_RUN,
    (...args) => mockedRun(...args)
  )

  mockedInternalCommands.registerCommand(AvailableCommands.STAGE_LIST, () =>
    mockedListStages()
  )

  mockedInternalCommands.registerCommand(
    AvailableCommands.GIT_GET_BRANCHES,
    () => mockedGetBranches()
  )

  mockedInternalCommands.registerCommand(
    AvailableCommands.EXP_BRANCH,
    mockedExpBranch
  )

  const workspaceExperiments = new WorkspaceExperiments(
    mockedInternalCommands,
    buildMockMemento(),
    {
      '/my/dvc/root': {
        getDvcRoot: () => mockedDvcRoot,
        getPipelineCwd: () => mockedDvcRoot,
        pickCommitOrExperiment: mockedPickCommitOrExperiment,
        showWebview: mockedShowWebview
      } as unknown as Experiments,
      '/my/fun/dvc/root': {
        getDvcRoot: () => mockedOtherDvcRoot,
        getPipelineCwd: () => mockedOtherDvcRoot,
        pickExperiment: jest.fn(),
        showWebview: jest.fn()
      } as unknown as Experiments
    },
    buildMockedEventEmitter()
  )

  describe('getCwdThenReport', () => {
    it('should call the correct function with the correct parameters if a project is picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')

      await workspaceExperiments.getCwdThenReport(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledWith(mockedDvcRoot)
    })

    it('should not call the function if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdThenReport(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).not.toHaveBeenCalled()
    })
  })

  describe('getExpNameThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      mockedPickCommitOrExperiment.mockResolvedValueOnce('a123456')

      await workspaceExperiments.getCwdAndExpNameThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedPickCommitOrExperiment).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledWith(mockedDvcRoot, 'a123456')
    })

    it('should not call the function if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdAndExpNameThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).not.toHaveBeenCalled()
    })
  })

  describe('getCwdAndQuickPickThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and the quick pick returns a list', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')

      const mockedPickedOptions = ['a', 'b', 'c']
      const mockedQuickPick = jest
        .fn()
        .mockResolvedValueOnce(mockedPickedOptions)
      await workspaceExperiments.getCwdAndQuickPickThenRun(
        mockedCommandId,
        mockedQuickPick
      )

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedQuickPick).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledWith(
        mockedDvcRoot,
        ...mockedPickedOptions
      )
    })

    it('should not call the function or ask for quick picks if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)
      const mockedQuickPick = jest.fn()

      await workspaceExperiments.getCwdAndQuickPickThenRun(
        mockedCommandId,
        mockedQuickPick
      )

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedQuickPick).not.toHaveBeenCalled()
      expect(mockedExpFunc).not.toHaveBeenCalled()
    })

    it('should not call the function if quick picks are not provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      const mockedQuickPick = jest.fn().mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdAndQuickPickThenRun(
        mockedCommandId,
        mockedQuickPick
      )

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedQuickPick).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).not.toHaveBeenCalled()
    })
  })

  describe('createExperimentBranch', () => {
    it('should create a branch with the correct name if a project and experiment are picked and an input provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      mockedPickCommitOrExperiment.mockResolvedValueOnce('a123456')
      mockedGetInput.mockResolvedValueOnce('abc123')

      await workspaceExperiments.createExperimentBranch()

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedGetInput).toHaveBeenCalledWith(
        Title.ENTER_BRANCH_NAME,
        'a123456-branch'
      )
      expect(mockedPickCommitOrExperiment).toHaveBeenCalledTimes(1)
      expect(mockedExpBranch).toHaveBeenCalledTimes(1)
      expect(mockedExpBranch).toHaveBeenCalledWith(
        mockedDvcRoot,
        'a123456',
        'abc123'
      )
    })

    it('should not ask for a branch name if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.createExperimentBranch()

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedGetInput).not.toHaveBeenCalled()
      expect(mockedExpBranch).not.toHaveBeenCalled()
    })

    it('should not create a branch if the user does not provide a name', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      mockedPickCommitOrExperiment.mockResolvedValueOnce('exp-456')
      mockedGetInput.mockResolvedValueOnce(undefined)

      await workspaceExperiments.createExperimentBranch()

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedGetInput).toHaveBeenCalledTimes(1)
      expect(mockedExpBranch).not.toHaveBeenCalled()
    })
  })

  describe('getCwdThenRun', () => {
    it('should call the correct function with the correct parameters if a project is picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledWith(mockedDvcRoot)
    })

    it('should not call the function if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).not.toHaveBeenCalled()
    })

    it('should check for pipelines when a command needs it and continue with the command if there is a pipeline', async () => {
      const executeCommandSpy = jest.spyOn(
        mockedInternalCommands,
        'executeCommand'
      )

      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(executeCommandSpy).toHaveBeenCalledWith(
        mockedCommandId,
        mockedDvcRoot
      )
    })

    it('should not ask the user for the stage name if there are pipelines', async () => {
      mockedListStages.mockResolvedValueOnce('train')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedGetValidInput).not.toHaveBeenCalledWith(
        Title.ENTER_STAGE_NAME,
        expect.anything(),
        expect.anything()
      )
    })
  })

  describe('selectBranches', () => {
    it('should get all the branches from GIT_GET_BRANCHES command', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedGetBranches.mockResolvedValueOnce(['* main'])

      await workspaceExperiments.selectBranches([])

      expect(mockedGetBranches).toHaveBeenCalledTimes(1)
    })

    it('should show a quick pick to select many values when called', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedGetBranches.mockResolvedValueOnce(['* main'])

      await workspaceExperiments.selectBranches([])

      expect(mockedQuickPickManyValues).toHaveBeenCalledTimes(1)
    })

    it('should display all branches in the quick pick', async () => {
      const allBranches = [
        'main',
        'special-branch',
        'important-fix',
        'exp-best'
      ]
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedGetBranches.mockResolvedValueOnce(allBranches)

      await workspaceExperiments.selectBranches([])

      expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
        allBranches.map(branch =>
          expect.objectContaining({ label: branch, value: branch })
        ),
        expect.anything()
      )
    })

    it('should not display the current branch in the quick pick', async () => {
      const allBranches = [
        '* (HEAD detached at XXXX)',
        'main',
        'special-branch',
        'important-fix',
        'exp-best'
      ]
      mockedQuickPickOne.mockResolvedValue(mockedDvcRoot)
      mockedGetBranches.mockResolvedValueOnce(allBranches)

      await workspaceExperiments.selectBranches([])

      expect(mockedQuickPickManyValues).not.toHaveBeenCalledWith(
        allBranches.map(branch =>
          expect.objectContaining({ label: branch, value: branch })
        ),
        expect.anything()
      )

      mockedQuickPickManyValues.mockResolvedValueOnce([])

      const updatedAllBranches = [
        'main',
        '* (special-branch)',
        'important-fix',
        'exp-best'
      ]

      mockedGetBranches.mockResolvedValueOnce(updatedAllBranches)

      await workspaceExperiments.selectBranches([])

      expect(mockedQuickPickManyValues).not.toHaveBeenCalledWith(
        updatedAllBranches.map(branch =>
          expect.objectContaining({ label: branch, value: branch })
        ),
        expect.anything()
      )
    })

    it('should mark the selected branches as picked in the quick pick', async () => {
      const allBranches = [
        'main',
        'special-branch',
        'important-fix',
        'exp-best'
      ]
      const selectedBranches = ['main', 'exp-best']
      mockedQuickPickOne.mockResolvedValue(mockedDvcRoot)
      mockedGetBranches.mockResolvedValueOnce(allBranches)

      await workspaceExperiments.selectBranches(selectedBranches)

      expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
        [
          { label: 'main', picked: true, value: 'main' },
          { label: 'special-branch', picked: false, value: 'special-branch' },
          { label: 'important-fix', picked: false, value: 'important-fix' },
          { label: 'exp-best', picked: true, value: 'exp-best' }
        ],
        expect.anything()
      )
    })

    it('should return early if no dvcRoot is selected', async () => {
      mockedQuickPickOne.mockResolvedValue(undefined)
      mockedGetBranches.mockResolvedValueOnce([])

      await workspaceExperiments.selectBranches([])

      expect(mockedGetBranches).not.toHaveBeenCalled()
      expect(mockedQuickPickManyValues).not.toHaveBeenCalled()
    })
  })
})
