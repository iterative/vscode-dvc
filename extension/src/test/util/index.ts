import { join, resolve } from 'path'
import { Memento, Uri } from 'vscode'

export const dvcDemoPath = Uri.file(
  resolve(__dirname, '..', '..', '..', '..', 'demo')
).fsPath

export const basePlotsUrl = join(dvcDemoPath, 'plots')

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
