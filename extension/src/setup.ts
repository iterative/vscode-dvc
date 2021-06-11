import { window, workspace, WorkspaceFolder } from 'vscode'
import { Config } from './config'
import { findDvcRootPaths } from './fileSystem'
import { DecorationProvider } from './repository/decorationProvider'
import { definedAndNonEmpty } from './util/array'
import { Repository } from './repository'
import {
  getRepositoryWatcher,
  onDidChangeFileSystem
} from './fileSystem/watcher'
import { TrackedExplorerTree } from './fileSystem/views/trackedExplorerTree'
import { CliReader } from './cli/reader'
import { Experiments } from './experiments'
import { ResourceLocator } from './resourceLocator'
import { setContextValue } from './vscode/context'
import { getGitRepositoryRoots } from './extensions/git'

const setProjectAvailability = (available: boolean) =>
  setContextValue('dvc.project.available', available)

const initializeDvcRepositories = (extension: IExtension) => {
  extension.getDvcRoots().forEach(dvcRoot => {
    if (!extension.getRepository(dvcRoot)) {
      const repository = new Repository(
        dvcRoot,
        extension.getCliReader(),
        extension.getDecorationProvider(dvcRoot)
      )

      repository.dispose.track(
        onDidChangeFileSystem(
          dvcRoot,
          getRepositoryWatcher(repository, extension.getTrackedExplorerTree())
        )
      )

      extension.setRepository(dvcRoot, repository)
    }
  })
}

const initializeExperiments = (extension: IExtension) => {
  const experiments = extension.getExperiments()
  experiments.reset()
  experiments.create(extension.getDvcRoots(), extension.getResourceLocator())
}

const initializeGitRepositories = async (extension: IExtension) => {
  const experiments = extension.getExperiments()
  const [, gitRoots] = await Promise.all([
    experiments.isReady(),
    getGitRepositoryRoots()
  ])
  gitRoots.forEach(async gitRoot => {
    const dvcRoots = await findDvcRootPaths(
      gitRoot,
      extension.getCliReader().root(gitRoot)
    )

    dvcRoots.forEach(dvcRoot => {
      experiments.onDidChangeData(dvcRoot, gitRoot)
    })
  })
}

const initialize = (extension: IExtension) => {
  initializeDvcRepositories(extension)

  extension.getTrackedExplorerTree().initialize(extension.getDvcRoots())

  initializeExperiments(extension)

  initializeGitRepositories(extension)

  return extension.setAvailable()
}

const initializeDecorationProvidersEarly = (extension: IExtension) =>
  extension
    .getDvcRoots()
    .forEach(dvcRoot =>
      extension.setDecorationProvider(dvcRoot, new DecorationProvider())
    )

const setupWorkspaceFolder = async (
  extension: IExtension,
  workspaceFolder: WorkspaceFolder
) => {
  const workspaceFolderRoot = workspaceFolder.uri.fsPath
  const dvcRoots = await findDvcRootPaths(
    workspaceFolderRoot,
    extension.getCliReader().root(workspaceFolderRoot)
  )

  extension.setDvcRoots(dvcRoots)
  extension.config.setDvcRoots(dvcRoots)

  if (definedAndNonEmpty(dvcRoots)) {
    initializeDecorationProvidersEarly(extension)
    setProjectAvailability(true)
  }
}

export interface IExtension {
  config: Config
  canRunCli: () => Promise<boolean>

  getCliReader: () => CliReader

  getDvcRoots: () => string[]
  setDvcRoots: (dvcRoots: string[]) => void

  getDecorationProvider: (dvcRoot: string) => DecorationProvider
  setDecorationProvider: (
    dvcRoot: string,
    decorationProvider: DecorationProvider
  ) => void

  getExperiments: () => Experiments

  getRepository: (dvcRoot: string) => Repository
  setRepository: (dvcRoot: string, repository: Repository) => void
  resetRepositories: () => void

  getResourceLocator: () => ResourceLocator

  getTrackedExplorerTree: () => TrackedExplorerTree

  setAvailable: () => void
  setUnavailable: () => void
}

const initializeOrNotify = async (extension: IExtension) => {
  const root = extension.config.firstWorkspaceFolderRoot
  if (!root) {
    extension.setUnavailable()
  } else if (await extension.canRunCli()) {
    initialize(extension)
  } else {
    window.showInformationMessage(
      'DVC extension is unable to initialize as the cli is not available.\n' +
        'Update your config options to try again.'
    )
    extension.setUnavailable()
  }
}

export const setup = async (extension: IExtension) => {
  await Promise.all([
    (workspace.workspaceFolders || []).map(workspaceFolder =>
      setupWorkspaceFolder(extension, workspaceFolder)
    ),
    extension.config.isReady()
  ])

  return initializeOrNotify(extension)
}
