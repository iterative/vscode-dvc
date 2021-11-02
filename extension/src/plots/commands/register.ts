import { commands } from 'vscode'
import { RegisteredCommands } from '../../commands/external'
import { WorkspacePlots } from '../workspace'

export const registerPlotsCommands = (plots: WorkspacePlots) => {
  commands.registerCommand(RegisteredCommands.PLOTS_SHOW, () => {
    plots.showWebview()
  })
}
