import { commands } from 'vscode'
import { RegisteredCommands } from './external'
import { addPlotCommand } from './util'
import { quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'

jest.mock('../vscode/quickPick')

const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedCommands = jest.mocked(commands)
const mockedExecuteCommand = jest.fn()
mockedCommands.executeCommand = mockedExecuteCommand

beforeEach(() => {
  jest.resetAllMocks()
})

describe('addPlotCommand', () => {
  it('should call no add commands if no plots types are selected', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await addPlotCommand(undefined)

    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        {
          description: 'Create a dvc.yaml plot based off a chosen data file',
          label: 'Top-Level',
          value: 'top-level'
        },
        {
          description:
            'Create an extension-only plot based off a chosen metric and param',
          label: 'Custom',
          value: 'custom'
        }
      ],
      {
        title: Title.SELECT_PLOT_TYPE
      }
    )
    expect(mockedExecuteCommand).not.toHaveBeenCalled()
  })

  it('should call the add top-level plot command if the top-level type is selected', async () => {
    mockedQuickPickValue.mockResolvedValueOnce('top-level')

    await addPlotCommand(undefined)

    expect(mockedExecuteCommand).toHaveBeenCalledWith(
      RegisteredCommands.PIPELINE_ADD_PLOT,
      undefined
    )
  })

  it('should call the add custom plot command if the custom type is selected', async () => {
    mockedQuickPickValue.mockResolvedValueOnce('custom')

    await addPlotCommand('cwd')

    expect(mockedExecuteCommand).toHaveBeenCalledWith(
      RegisteredCommands.PLOTS_CUSTOM_ADD,
      'cwd'
    )
  })
})
