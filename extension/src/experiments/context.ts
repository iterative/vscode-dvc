import { Event, EventEmitter, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { ContextKey, setContextValue } from '../vscode/context'
import { standardizePossiblePath } from '../fileSystem/path'
import { isPathInProject, isPathInSubProject } from '../fileSystem'

const setContextOnDidChangeParamsFiles = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  onDidChangeColumns: Event<void>,
  getParamsFiles: () => Set<string>,
  subProjects: string[]
): Disposable =>
  onDidChangeColumns(() => {
    const path = standardizePossiblePath(
      window.activeTextEditor?.document.fileName
    )
    if (!path) {
      return
    }

    if (
      (!getParamsFiles().has(path) && !path.endsWith('dvc.yaml')) ||
      isPathInSubProject(path, subProjects)
    ) {
      return
    }
    setActiveEditorContext(true)
  })

const setContextOnDidChangeActiveEditor = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  dvcRoot: string,
  getParamsFiles: () => Set<string>,
  subProjects: string[]
): Disposable =>
  window.onDidChangeActiveTextEditor(event => {
    const path = standardizePossiblePath(event?.document.fileName)
    if (!path) {
      setActiveEditorContext(false)
      return
    }

    if (!isPathInProject(path, dvcRoot, subProjects)) {
      return
    }

    const isParamsFile = getParamsFiles().has(path)
    const isDvcYaml = path.endsWith('dvc.yaml')

    setActiveEditorContext(isParamsFile || isDvcYaml)
  })

export const setContextForEditorTitleIcons = (
  dvcRoot: string,
  disposer: (() => void) & Disposer,
  getParamsFiles: () => Set<string>,
  experimentsFileFocused: EventEmitter<string | undefined>,
  onDidChangeColumns: Event<void>,
  subProjects: string[]
): void => {
  const setActiveEditorContext = (experimentsFileActive: boolean) => {
    void setContextValue(
      ContextKey.EXPERIMENTS_FILE_ACTIVE,
      experimentsFileActive
    )
    const activeDvcRoot = experimentsFileActive ? dvcRoot : undefined
    experimentsFileFocused.fire(activeDvcRoot)
  }

  disposer.track(
    setContextOnDidChangeParamsFiles(
      setActiveEditorContext,
      onDidChangeColumns,
      getParamsFiles,
      subProjects
    )
  )

  disposer.track(
    setContextOnDidChangeActiveEditor(
      setActiveEditorContext,
      dvcRoot,
      getParamsFiles,
      subProjects
    )
  )
}
