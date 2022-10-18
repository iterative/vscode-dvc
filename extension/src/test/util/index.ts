import { resolve } from 'path'
import { Memento, Uri, workspace, WorkspaceFolder } from 'vscode'

const dvcRoot = resolve(__dirname, '..', '..', '..', '..', 'vscode-dvc-demo')

export const dvcDemoPath = Uri.file(dvcRoot).fsPath
export const basePlotsUrl = Uri.file(
  resolve(__dirname, '..', 'fixtures', 'plotsDiff', 'staticImages')
).fsPath

export const getTestWorkspaceFolder = (): WorkspaceFolder =>
  (workspace.workspaceFolders as WorkspaceFolder[])[0]

export const buildMockMemento = (
  values: Record<string, unknown> = {}
): Memento =>
  ({
    get: (key: string, defaultValue: unknown) => values[key] || defaultValue,
    keys: () => Object.keys(values),
    update: (key: string, value: unknown) =>
      new Promise(() => {
        values[key] = value
      })
  } as unknown as Memento)
