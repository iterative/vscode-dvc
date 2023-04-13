import { resolve } from 'path'
import { Memento, Uri, workspace, WorkspaceFolder } from 'vscode'
import {
  ExpData,
  EXPERIMENT_WORKSPACE_ID,
  ExpRange,
  ExpShowOutput,
  ExpState
} from '../../cli/dvc/contract'

const dvcRoot = resolve(__dirname, '..', '..', '..', '..', 'demo')
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
    update: (key: string, value: unknown) => {
      values[key] = value
      void Promise.resolve()
    }
  } as unknown as Memento)

export const generateTestExpData = (data: Partial<ExpData> = {}): ExpData => ({
  deps: null,
  meta: { has_checkpoints: false },
  metrics: null,
  outs: null,
  params: null,
  rev: EXPERIMENT_WORKSPACE_ID,
  timestamp: null,
  ...data
})

export const generateTestExpState = (
  rev: string,
  data: Partial<ExpData> = {},
  name?: string
): ExpState => ({
  data: generateTestExpData({ ...data, rev }),
  name,
  rev
})

export const generateWorkspaceOnlyExpShowOutput = (
  data: Partial<ExpData> = {}
): ExpShowOutput => [generateTestExpState(EXPERIMENT_WORKSPACE_ID, data)]

const isTestExpWithName = (
  testExp:
    | { rev: string; name: string; data: Partial<ExpData> }
    | Partial<ExpData>
): testExp is { rev: string; name: string; data: Partial<ExpData> } =>
  !!(testExp as { name: string }).name

export const generateCommitWithExperiments = (
  rev: string,
  testCommit: Partial<ExpData>,
  testExps: (
    | { rev: string; name: string; data: Partial<ExpData> }
    | Partial<ExpData>
  )[]
) => {
  const experiments: ExpRange[] = []

  let i = 0
  for (const testExp of testExps) {
    i = i + 1
    if (isTestExpWithName(testExp)) {
      const { rev, data, name } = testExp
      experiments.push({
        executor: null,
        name,
        revs: [
          generateTestExpState(
            rev || String(i).repeat(6).slice(0, 6),
            data,
            name
          )
        ]
      })
      continue
    }

    const name = `exp-${i}`
    experiments.push({
      executor: null,
      name,
      revs: [
        generateTestExpState(String(i).repeat(6).slice(0, 6), testExp, name)
      ]
    })
  }

  return {
    ...generateTestExpState(rev, testCommit),
    experiments
  }
}
