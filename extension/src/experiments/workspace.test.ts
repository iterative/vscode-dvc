import { Disposable, Disposer } from '@hediet/std/disposable'
import { Experiments } from '.'
import { scriptCommand, WorkspaceExperiments } from './workspace'
import { quickPickOne, quickPickOneOrInput } from '../vscode/quickPick'
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
import { Args } from '../cli/dvc/constants'
import { findOrCreateDvcYamlFile, getFileExtension } from '../fileSystem'

const mockedShowWebview = jest.fn()
const mockedDisposable = jest.mocked(Disposable)
const mockedDvcRoot = '/my/dvc/root'
const mockedOtherDvcRoot = '/my/fun/dvc/root'
const mockedQuickPickOne = jest.mocked(quickPickOne)
const mockedQuickPickOneOrInput = jest.mocked(quickPickOneOrInput)
const mockedGetValidInput = jest.mocked(getValidInput)
const mockedPickExperiment = jest.fn()
const mockedGetInput = jest.mocked(getInput)
const mockedRun = jest.fn()
const mockedExpFunc = jest.fn()
const mockedListStages = jest.fn()
const mockedFindOrCreateDvcYamlFile = jest.mocked(findOrCreateDvcYamlFile)
const mockedGetFileExtension = jest.mocked(getFileExtension)

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../vscode/quickPick')
jest.mock('../vscode/inputBox')
jest.mock('../fileSystem')

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

  const mockedUpdatesPaused = buildMockedEventEmitter<boolean>()

  const workspaceExperiments = new WorkspaceExperiments(
    mockedInternalCommands,
    mockedUpdatesPaused,
    buildMockMemento(),
    {
      '/my/dvc/root': {
        getDvcRoot: () => mockedDvcRoot,
        pickExperiment: mockedPickExperiment,
        showWebview: mockedShowWebview
      } as unknown as Experiments,
      '/my/fun/dvc/root': {
        getDvcRoot: () => mockedOtherDvcRoot,
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

  describe('pauseUpdatesThenRun', () => {
    it('should pause updates, run the function and then flush the queue', async () => {
      const mockedFunc = jest.fn()

      await workspaceExperiments.pauseUpdatesThenRun(mockedFunc)

      expect(mockedUpdatesPaused.fire).toHaveBeenCalledTimes(2)
      expect(mockedUpdatesPaused.fire).toHaveBeenCalledWith(true)
      expect(mockedUpdatesPaused.fire).toHaveBeenLastCalledWith(false)
      expect(mockedFunc).toHaveBeenCalledTimes(1)
    })
  })

  describe('getExpNameThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      mockedPickExperiment.mockResolvedValueOnce({
        id: 'a123456',
        name: 'exp-123'
      })

      await workspaceExperiments.getCwdAndExpNameThenRun(mockedCommandId)

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedPickExperiment).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledWith(mockedDvcRoot, 'exp-123')
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

  describe('getCwdExpNameAndInputThenRun', () => {
    it('should call the correct function with the correct parameters if a project and experiment are picked and an input provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      mockedPickExperiment.mockResolvedValueOnce({
        id: 'a123456',
        name: 'exp-123'
      })
      mockedGetInput.mockResolvedValueOnce('abc123')

      await workspaceExperiments.getCwdExpNameAndInputThenRun(
        (cwd: string, ...args: Args) =>
          workspaceExperiments.runCommand(mockedCommandId, cwd, ...args),
        'enter your password please' as Title
      )

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedPickExperiment).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).toHaveBeenCalledWith(
        mockedDvcRoot,
        'exp-123',
        'abc123'
      )
    })

    it('should not call the function or ask for input if a project is not picked', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdExpNameAndInputThenRun(
        (cwd: string, ...args: Args) =>
          workspaceExperiments.runCommand(mockedCommandId, cwd, ...args),
        'please name the branch' as Title
      )

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedGetInput).not.toHaveBeenCalled()
      expect(mockedExpFunc).not.toHaveBeenCalled()
    })

    it('should not call the function if user input is not provided', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedListStages.mockResolvedValueOnce('train')
      mockedPickExperiment.mockResolvedValueOnce({
        id: 'b456789',
        name: 'exp-456'
      })
      mockedGetInput.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdExpNameAndInputThenRun(
        (cwd: string, ...args: Args) =>
          workspaceExperiments.runCommand(mockedCommandId, cwd, ...args),
        'please enter your bank account number and sort code' as Title
      )

      expect(mockedQuickPickOne).toHaveBeenCalledTimes(1)
      expect(mockedGetInput).toHaveBeenCalledTimes(1)
      expect(mockedExpFunc).not.toHaveBeenCalled()
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

    it('should ensure that a dvc.yaml file exists', async () => {
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.py'
      )

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedFindOrCreateDvcYamlFile).toHaveBeenCalledTimes(1)
    })

    it('should check for pipelines when a command needs it and continue with the command if there is a pipeline', async () => {
      const executeCommandSpy = jest.spyOn(
        mockedInternalCommands,
        'executeCommand'
      )

      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('train')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(executeCommandSpy).toHaveBeenCalledWith(
        AvailableCommands.STAGE_LIST,
        mockedDvcRoot
      )
      expect(executeCommandSpy).toHaveBeenCalledWith(
        mockedCommandId,
        mockedDvcRoot
      )
    })

    it('should ask the user for the stage name if there are no pipelines', async () => {
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedGetValidInput).toHaveBeenCalledWith(
        Title.ENTER_STAGE_NAME,
        expect.anything(),
        expect.anything()
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

    it('should not run the command if no stage name was given', async () => {
      const executeCommandSpy = jest.spyOn(
        mockedInternalCommands,
        'executeCommand'
      )

      mockedGetValidInput.mockResolvedValueOnce('')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(executeCommandSpy).not.toHaveBeenCalledWith(
        mockedCommandId,
        mockedDvcRoot
      )
    })

    it('should let the user select a training script or enter its path if there are no pipelines found', async () => {
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.py'
      )

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedQuickPickOneOrInput).toHaveBeenCalledTimes(1)
    })

    it('should add the train stage to the dvc.yaml file if the path to the training script was given', async () => {
      const trainingScript = 'path/to/training_script.py'

      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(trainingScript)
      mockedGetFileExtension.mockReturnValueOnce('.py')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedFindOrCreateDvcYamlFile).toHaveBeenCalledWith(
        mockedDvcRoot,
        trainingScript,
        'train',
        scriptCommand.PYTHON
      )
    })

    it('should continue with the command if the path to the training script is entered', async () => {
      const executeCommandSpy = jest.spyOn(
        mockedInternalCommands,
        'executeCommand'
      )

      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.py'
      )

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(executeCommandSpy).toHaveBeenCalledWith(
        mockedCommandId,
        mockedDvcRoot
      )
    })

    it('should add python as a command to the dvc.yaml file if the file has the .py extension', async () => {
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.py'
      )
      mockedGetFileExtension.mockReturnValueOnce('.py')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedFindOrCreateDvcYamlFile).toHaveBeenCalledWith(
        mockedDvcRoot,
        'path/to/training_script.py',
        'train',
        scriptCommand.PYTHON
      )
    })

    it('should add jupyter nbconvert as a command to the dvc.yaml file if the file has the .ipynb extension', async () => {
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.ipynb'
      )
      mockedGetFileExtension.mockReturnValueOnce('.ipynb')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedFindOrCreateDvcYamlFile).toHaveBeenCalledWith(
        mockedDvcRoot,
        'path/to/training_script.ipynb',
        'train',
        scriptCommand.JUPYTER
      )
    })

    it('should not ask to enter a custom command if the file is a python file or Jupyter notebook', async () => {
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.ipynb'
      )
      mockedGetFileExtension.mockReturnValueOnce('.ipynb')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedGetInput).not.toHaveBeenCalledWith(
        Title.ENTER_COMMAND_TO_RUN
      )
    })

    it('should ask to enter a custom command if the file is not a python file or Jupyter notebook', async () => {
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.js'
      )
      mockedGetFileExtension.mockReturnValueOnce('.js')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedGetInput).toHaveBeenCalledWith(Title.ENTER_COMMAND_TO_RUN)
    })

    it('should add the custom command to the dvc.yaml file', async () => {
      const customCommand = 'node'

      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.js'
      )
      mockedGetFileExtension.mockReturnValueOnce('.js')
      mockedGetInput.mockResolvedValueOnce(customCommand)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedFindOrCreateDvcYamlFile).toHaveBeenCalledWith(
        mockedDvcRoot,
        'path/to/training_script.js',
        'train',
        customCommand
      )
    })

    it('should not add a custom command to the dvc.yaml file if the command was not provided', async () => {
      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce(
        'path/to/training_script.js'
      )
      mockedGetFileExtension.mockReturnValueOnce('.js')
      mockedGetInput.mockResolvedValueOnce(undefined)

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(mockedFindOrCreateDvcYamlFile).toHaveBeenCalledWith(
        mockedDvcRoot,
        'path/to/training_script.js',
        'train',
        ''
      )
    })

    it('should not run the command if the path to the training script was not given', async () => {
      const executeCommandSpy = jest.spyOn(
        mockedInternalCommands,
        'executeCommand'
      )

      mockedGetValidInput.mockResolvedValueOnce('train')
      mockedListStages.mockResolvedValueOnce('')
      mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
      mockedQuickPickOneOrInput.mockResolvedValueOnce('')

      await workspaceExperiments.getCwdThenRun(mockedCommandId)

      expect(executeCommandSpy).not.toHaveBeenCalledWith(
        mockedCommandId,
        mockedDvcRoot
      )
    })
  })
})
