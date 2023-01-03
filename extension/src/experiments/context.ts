import { Event, EventEmitter, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { ContextKey, setContextValue } from '../vscode/context'
import { standardizePossiblePath } from '../fileSystem/path'

const setContextOnDidChangeParamsFiles = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  onDidChangeColumns: Event<void>,
  getParamsFiles: () => Set<string>
): Disposable =>
  onDidChangeColumns(() => {
    const path = standardizePossiblePath(
      window.activeTextEditor?.document.fileName
    )
    if (!path) {
      return
    }

    if (!getParamsFiles().has(path)) {
      return
    }
    setActiveEditorContext(true)
  })

const setContextOnDidChangeActiveEditor = (
  setActiveEditorContext: (paramsFileActive: boolean) => void,
  dvcRoot: string,
  getParamsFiles: () => Set<string>
): Disposable =>
  window.onDidChangeActiveTextEditor(event => {
    const path = standardizePossiblePath(event?.document.fileName)
    if (!path) {
      setActiveEditorContext(false)
      return
    }

    if (!path.includes(dvcRoot)) {
      return
    }

    const isParamsFile = getParamsFiles().has(path)

    setActiveEditorContext(isParamsFile)
  })

export const setContextForEditorTitleIcons = (
  dvcRoot: string,
  disposer: (() => void) & Disposer,
  getParamsFiles: () => Set<string>,
  paramsFileFocused: EventEmitter<string | undefined>,
  onDidChangeColumns: Event<void>
): void => {
  const setActiveEditorContext = (paramsFileActive: boolean) => {
    setContextValue(ContextKey.PARAMS_FILE_ACTIVE, paramsFileActive)
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
