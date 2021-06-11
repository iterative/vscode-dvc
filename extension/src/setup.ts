import { window } from 'vscode'
import { Config } from './config'
import { findDvcRootPaths } from './fileSystem'
import { DecorationProvider } from './repository/decorationProvider'
import { Repository } from './repository'
import {
  getRepositoryWatcher,
  onDidChangeFileSystem
} from './fileSystem/watcher'
import { TrackedExplorerTree } from './fileSystem/views/trackedExplorerTree'
import { CliReader } from './cli/reader'
import { Experiments } from './experiments'
import { ResourceLocator } from './resourceLocator'
import { getGitRepositoryRoots } from './extensions/git'

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
  experiments.create(extension.getDvcRoots(), extension.getResourceLocator())
}

const initializeGitRepositories = async (extension: IExtension) => {
  const experiments = extension.getExperiments()
  const [, gitRoots] = await Promise.all([
    experiments.isReady(),
    getGitRepositoryRoots()
  ])
  gitRoots.forEach(async gitRoot => {
    const dvcRoots = await findDvcRootPaths(gitRoot)

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

  getResourceLocator: () => ResourceLocator

  getTrackedExplorerTree: () => TrackedExplorerTree

  setAvailable: () => void
  setUnavailable: () => void
}

export const initializeOrNotify = async (extension: IExtension) => {
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
