import { commands } from 'vscode'
import { RegisteredCommands } from './external'
import { Setup } from '../setup'
import { Context } from '../vscode/context'
import { quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'

export const showSetupOrExecuteCommand =
  <T>(setup: Setup, callback: (context: Context) => Promise<T | undefined>) =>
  async (context: Context) => {
    await setup.isReady()
    const { dvc, experiments } = setup.shouldBeShown()
    if (!dvc) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW_DVC)
    }

    if (!experiments) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW_EXPERIMENTS)
    }

    return callback(context)
  }

const enum PLOT_TYPE {
  CUSTOM,
  TOP_LEVEL
}

export const addPlotCommand = async (context: Context) => {
  const result: PLOT_TYPE | undefined = await quickPickValue(
    [
      {
        description: 'Create a dvc.yaml plot based off a chosen data file',
        label: 'Top-Level',
        value: PLOT_TYPE.TOP_LEVEL
      },
      {
        description:
          'Create an extension-only plot based off a chosen metric and param',
        label: 'Custom',
        value: PLOT_TYPE.CUSTOM
      }
    ],
    {
      title: Title.SELECT_PLOT_TYPE
    }
  )

  if (result === PLOT_TYPE.CUSTOM) {
    return commands.executeCommand(RegisteredCommands.PLOTS_CUSTOM_ADD, context)
  }

  if (result === PLOT_TYPE.TOP_LEVEL) {
    return commands.executeCommand(
      RegisteredCommands.PIPELINE_ADD_PLOT,
      context
    )
  }
}
