import { Setup } from '..'
import { Flag, SubCommand } from '../../cli/dvc/constants'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { definedAndNonEmpty } from '../../util/array'
import { getInput } from '../../vscode/inputBox'
import { quickPickYesOrNo } from '../../vscode/quickPick'
import { Title } from '../../vscode/title'
import { Toast } from '../../vscode/toast'
import { getOnlyOrPickProject } from '../../workspace/util'

const noExistingOrUserConfirms = async (
  internalCommands: InternalCommands,
  dvcRoot: string
): Promise<boolean | undefined> => {
  const remoteList = await internalCommands.executeCommand(
    AvailableCommands.REMOTE,
    dvcRoot,
    SubCommand.LIST
  )

  if (!remoteList) {
    return true
  }

  return await quickPickYesOrNo(
    'make this new remote the default',
    'keep the current default',
    {
      placeHolder: 'Would you like to set this new remote as the default?',
      title: Title.SET_REMOTE_AS_DEFAULT
    }
  )
}

const addRemoteToProject = async (
  internalCommands: InternalCommands,
  dvcRoot: string
): Promise<void> => {
  const name = await getInput(Title.ENTER_REMOTE_NAME)
  if (!name) {
    return
  }

  const url = await getInput(Title.ENTER_REMOTE_URL)
  if (!url) {
    return
  }

  const args = [Flag.PROJECT, name, url]

  const shouldSetAsDefault = await noExistingOrUserConfirms(
    internalCommands,
    dvcRoot
  )
  if (shouldSetAsDefault === undefined) {
    return
  }

  if (shouldSetAsDefault) {
    args.unshift(Flag.DEFAULT)
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

export const getAddRemoteCommand =
  (setup: Setup, internalCommands: InternalCommands) =>
  async (): Promise<void> => {
    const dvcRoots = setup.getRoots()
    if (!definedAndNonEmpty(dvcRoots)) {
      return Toast.showError('Cannot add a remote without a DVC project')
    }
    const dvcRoot = await getOnlyOrPickProject(dvcRoots)

    if (!dvcRoot) {
      return
    }
    return addRemoteToProject(internalCommands, dvcRoot)
  }
