import { join, resolve } from 'path'
import { Memento, Uri } from 'vscode'

const dvcRoot = resolve(__dirname, '..', '..', '..', '..', 'demo')
export const dvcDemoPath = Uri.file(dvcRoot).fsPath
export const basePlotsUrl = Uri.file(join(dvcRoot, 'plots')).fsPath

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
