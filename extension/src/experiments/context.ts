import { Event, EventEmitter, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { setContextValue } from '../vscode/context'
import { standardizePath } from '../fileSystem/path'

const setContextOnDidChangeParamsFiles = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  onDidChangeColumns: Event<void>,
  getParamsFiles: () => Set<string>
): Disposable =>
  onDidChangeColumns(() => {
    const path = standardizePath(window.activeTextEditor?.document.fileName)
    if (!path) {
      return
    }

    if (!getParamsFiles().has(path)) {
      return
    }
    setActiveEditorContext(true)
  })

const setContextForRepository = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  path: string,
  getParamsFiles: () => Set<string>
) => {
  if (getParamsFiles().has(path)) {
    setActiveEditorContext(true)
    return
  }
  setActiveEditorContext(false)
}

const setContextOnDidChangeActiveEditor = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  dvcRoot: string,
  getParamsFiles: () => Set<string>
): Disposable =>
  window.onDidChangeActiveTextEditor(event => {
    const path = standardizePath(event?.document.fileName)
    if (!path) {
      setActiveEditorContext(false)
      return
    }

    if (!path.includes(dvcRoot)) {
      return
    }

    return setContextForRepository(setActiveEditorContext, path, getParamsFiles)
  })

export const setContextForEditorTitleIcons = (
  dvcRoot: string,
  disposer: (() => void) & Disposer,
  getParamsFiles: () => Set<string>,
  paramsFileFocused: EventEmitter<string | undefined>,
  onDidChangeColumns: Event<void>
): void => {
  const setActiveEditorContext = (paramsFileActive: boolean) => {
    setContextValue('dvc.params.fileActive', paramsFileActive)
    const activeDvcRoot = paramsFileActive ? dvcRoot : undefined
    paramsFileFocused.fire(activeDvcRoot)
  }

  disposer.track(
    setContextOnDidChangeParamsFiles(
      setActiveEditorContext,
      onDidChangeColumns,
      getParamsFiles
    )
  )

  disposer.track(
    setContextOnDidChangeActiveEditor(
      setActiveEditorContext,
      dvcRoot,
      getParamsFiles
    )
  )
}
