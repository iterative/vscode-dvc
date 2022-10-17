import { resolve } from 'path'
import { Memento, Uri } from 'vscode'

const dvcRoot = resolve(__dirname, '..', '..', '..', '..', 'vscode-dvc-demo')
const dvcDemoGitRoot = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '.git',
  'modules',
  'vscode-dvc-demo'
)
export const dvcDemoPath = Uri.file(dvcRoot).fsPath
export const dvcDemoGitPath = Uri.file(dvcDemoGitRoot).fsPath
export const basePlotsUrl = Uri.file(
  resolve(__dirname, '..', 'fixtures', 'plotsDiff', 'staticImages')
).fsPath

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
