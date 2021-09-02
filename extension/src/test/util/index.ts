import { Memento } from 'vscode'
import { Process } from '../../processExecution'

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

export const getMockedProcess = (stdout: string): Process =>
  ({
    on: jest.fn(),
    stdout: new Promise(resolve => resolve(stdout))
  } as unknown as Process)

export const getFailingMockedProcess = (stderr: string): Process =>
  ({
    on: jest.fn(),
    // eslint-disable-next-line promise/param-names
    stdout: new Promise((_, reject) => reject(new Error(stderr)))
  } as unknown as Process)
