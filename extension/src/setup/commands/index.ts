import { Setup } from '..'
import { Flag, SubCommand } from '../../cli/dvc/constants'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { definedAndNonEmpty } from '../../util/array'
import { trimAndSplit } from '../../util/stdout'
import { getInput } from '../../vscode/inputBox'
import { Modal } from '../../vscode/modal'
import {
  QuickPickItemWithValue,
  quickPickOne,
  quickPickValue,
  quickPickYesOrNo
} from '../../vscode/quickPick'
import { Response } from '../../vscode/response'
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

const getRemoteItems = (remotes: string[]): QuickPickItemWithValue[] => {
  const acc: QuickPickItemWithValue[] = []
  for (const remote of remotes) {
    const [name, url] = remote.split(/\s+/)
    acc.push({ description: url, label: name, value: name })
  }
  return acc
}

const getOnlyOrPickRemote = async (
  remotes: string[],
  title: Title
): Promise<string | undefined> => {
  if (remotes.length === 1) {
    return remotes[0].split(/\s+/)[0]
  }

  return await quickPickValue(getRemoteItems(remotes), {
    title
  })
}

enum ModifyOptions {
  NAME = 'Name',
  URL = 'URL'
}

const modifyRemoteName = async (
  internalCommands: InternalCommands,
  dvcRoot: string,
  remote: string
): Promise<void> => {
  const newName = await getInput(Title.ENTER_REMOTE_NAME)
  if (!newName) {
    return
  }
  return await Toast.showOutput(
    internalCommands.executeCommand(
      AvailableCommands.REMOTE,
      dvcRoot,
      SubCommand.RENAME,
      remote,
      newName
    )
  )
}

const modifyRemoteUrl = async (
  internalCommands: InternalCommands,
  dvcRoot: string,
  remote: string
): Promise<void> => {
  const newUrl = await getInput(Title.ENTER_REMOTE_URL)
  if (!newUrl) {
    return
  }
  return await Toast.showOutput(
    internalCommands.executeCommand(
      AvailableCommands.REMOTE,
      SubCommand.MODIFY,
      dvcRoot,
      remote,
      'url',
      newUrl
    )
  )
}

const modifyRemote = async (
  internalCommands: InternalCommands,
  dvcRoot: string,
  remote: string
): Promise<void> => {
  const option = await quickPickOne(
    Object.values(ModifyOptions),
    'Select an Option to Modify'
  )

  if (!option) {
    return
  }

  if (option === ModifyOptions.NAME) {
    return modifyRemoteName(internalCommands, dvcRoot, remote)
  }

  if (option === ModifyOptions.URL) {
    return modifyRemoteUrl(internalCommands, dvcRoot, remote)
  }
}

const pickRemoteAndModify = async (
  internalCommands: InternalCommands,
  dvcRoot: string
): Promise<void> => {
  const remoteList = await internalCommands.executeCommand(
    AvailableCommands.REMOTE,
    dvcRoot,
    SubCommand.LIST
  )

  const remotes = trimAndSplit(remoteList)

  if (!definedAndNonEmpty(remotes)) {
    return Toast.showError('No remotes to modify')
  }

  const remote = await getOnlyOrPickRemote(
    remotes,
    Title.SELECT_REMOTE_TO_MODIFY
  )
  if (!remote) {
    return
  }

  return modifyRemote(internalCommands, dvcRoot, remote)
}

export const getModifyRemoteCommand =
  (setup: Setup, internalCommands: InternalCommands) =>
  async (): Promise<void> => {
    const dvcRoots = setup.getRoots()
    if (!definedAndNonEmpty(dvcRoots)) {
      return Toast.showError('Cannot modify a remote without a DVC project')
    }
    const dvcRoot = await getOnlyOrPickProject(dvcRoots)

    if (!dvcRoot) {
      return
    }
    return pickRemoteAndModify(internalCommands, dvcRoot)
  }

const pickRemoteAndRemove = async (
  internalCommands: InternalCommands,
  dvcRoot: string
): Promise<void> => {
  const remoteList = await internalCommands.executeCommand(
    AvailableCommands.REMOTE,
    dvcRoot,
    SubCommand.LIST
  )

  const remotes = trimAndSplit(remoteList)

  if (!definedAndNonEmpty(remotes)) {
    return Toast.showError('No remotes to remove')
  }

  const remote = await getOnlyOrPickRemote(
    remotes,
    Title.SELECT_REMOTE_TO_REMOVE
  )
  if (!remote) {
    return
  }
  const shouldRemove = await Modal.warnOfConsequences(
    'This action is irreversible. Are you sure you want to remove this remote?',
    Response.REMOVE
  )

  if (shouldRemove !== Response.REMOVE) {
    return
  }

  try {
    await internalCommands.executeCommand(
      AvailableCommands.REMOTE,
      dvcRoot,
      SubCommand.REMOVE,
      Flag.PROJECT,
      remote
    )
  } catch {}

  try {
    await internalCommands.executeCommand(
      AvailableCommands.REMOTE,
      dvcRoot,
      SubCommand.REMOVE,
      Flag.LOCAL,
      remote
    )
  } catch {}
}

export const getRemoveRemoteCommand =
  (setup: Setup, internalCommands: InternalCommands) =>
  async (): Promise<void> => {
    const dvcRoots = setup.getRoots()
    if (!definedAndNonEmpty(dvcRoots)) {
      return Toast.showError('Cannot modify a remote without a DVC project')
    }
    const dvcRoot = await getOnlyOrPickProject(dvcRoots)

    if (!dvcRoot) {
      return
    }
    return pickRemoteAndRemove(internalCommands, dvcRoot)
  }
