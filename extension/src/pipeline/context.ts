import { dirname } from 'path'
import { EventEmitter, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { ContextKey, setContextValue } from '../vscode/context'
import { standardizePossiblePath } from '../fileSystem/path'

const setContextOnDidChangeActiveEditor = (
  setActiveEditorContext: (path: string) => void,
  dvcRoot: string
): Disposable =>
  window.onDidChangeActiveTextEditor(event => {
    const path = standardizePossiblePath(event?.document.fileName)
    if (!path) {
      setActiveEditorContext('')
      return
    }

    if (!path.includes(dvcRoot)) {
      return
    }

    setActiveEditorContext(path)
  })

export const setContextForEditorTitleIcons = (
  dvcRoot: string,
  disposer: (() => void) & Disposer,
  pipelineFileFocused: EventEmitter<string | undefined>
): void => {
  const setActiveEditorContext = (path: string) => {
    const pipeline = path.endsWith('dvc.yaml') ? dirname(path) : undefined
    void setContextValue(ContextKey.PIPELINE_FILE_ACTIVE, !!pipeline)
    pipelineFileFocused.fire(pipeline)
  }

  const activePath = window.activeTextEditor?.document?.fileName
  if (activePath?.startsWith(dvcRoot)) {
    setActiveEditorContext(activePath)
  }

  disposer.track(
    setContextOnDidChangeActiveEditor(setActiveEditorContext, dvcRoot)
  )
}
