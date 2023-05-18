import { commands } from 'vscode'
import { Setup } from '.'
import { run } from './runner'
import { SetupSection } from './webview/contract'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { definedAndNonEmpty } from '../util/array'
import { Toast } from '../vscode/toast'
import { SubCommand } from '../cli/dvc/constants'
import { getOnlyOrPickProject } from '../workspace/util'
import { getInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { quickPickYesOrNo } from '../vscode/quickPick'

const registerSetupConfigCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE,
    () => run(setup)
  )

  setup.dispose.track(
    commands.registerCommand(RegisteredCommands.EXTENSION_SETUP_WORKSPACE, () =>
      setup.setupWorkspace()
    )
  )
  internalCommands.registerExternalCommand(
    RegisteredCommands.SELECT_FOCUSED_PROJECTS,
    () => setup.selectFocusedProjects()
  )
}

const registerSetupShowCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW,
    async () => {
      await setup.showSetup()
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW_EXPERIMENTS,
    async () => {
      await setup.showSetup(SetupSection.EXPERIMENTS)
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW_DVC,
    async () => {
      await setup.showSetup(SetupSection.DVC)
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW_STUDIO_CONNECT,
    async () => {
      await setup.showSetup(SetupSection.STUDIO)
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW_STUDIO_SETTINGS,
    async () => {
      await setup.showSetup(SetupSection.STUDIO)
    }
  )
}

const registerSetupStudioCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.ADD_STUDIO_ACCESS_TOKEN,
    () => setup.saveStudioAccessToken()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.UPDATE_STUDIO_ACCESS_TOKEN,
    () => setup.saveStudioAccessToken()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN,
    () => setup.removeStudioAccessToken()
  )
}

export const registerSetupCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.INIT,
    async () => {
      const root = getFirstWorkspaceFolder()
      if (root) {
        await internalCommands.executeCommand(AvailableCommands.INIT, root)
      }
    }
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.REMOTE_ADD,
    // eslint-disable-next-line sonarjs/cognitive-complexity
    async () => {
      const dvcRoots = setup.getRoots()
      if (!definedAndNonEmpty(dvcRoots)) {
        return Toast.showError('Cannot add a remote without a DVC project')
      }
      const dvcRoot = await getOnlyOrPickProject(dvcRoots)

      if (!dvcRoot) {
        return
      }

      const name = await getInput(Title.ENTER_REMOTE_NAME)
      if (!name) {
        return
      }

      const url = await getInput(Title.ENTER_REMOTE_URL)
      if (!url) {
        return
      }

      const args = ['--project', name, url]

      const remoteList = await internalCommands.executeCommand(
        AvailableCommands.REMOTE,
        dvcRoot,
        SubCommand.LIST
      )

      let yesOrNo
      if (remoteList) {
        yesOrNo = await quickPickYesOrNo(
          'make this new remote the default',
          'the current default is correct',
          {
            placeHolder:
              'Would you like to set this new remote as the default?',
            title: Title.SET_REMOTE_AS_DEFAULT
          }
        )
        if (yesOrNo === undefined) {
          return
        }
      }

      if (!remoteList || yesOrNo) {
        args.unshift('-d')
      }

      return await Toast.showOutput(
        internalCommands.executeCommand(
          AvailableCommands.REMOTE,
          dvcRoot,
          SubCommand.ADD,
          ...args
        )
      )
    }
  )

  registerSetupConfigCommands(setup, internalCommands)
  registerSetupShowCommands(setup, internalCommands)
  registerSetupStudioCommands(setup, internalCommands)
}
