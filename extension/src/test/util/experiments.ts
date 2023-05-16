import {
  Executor,
  ExecutorState,
  ExpData,
  EXPERIMENT_WORKSPACE_ID,
  ExperimentStatus,
  ExpRange,
  ExpShowOutput,
  ExpState
} from '../../cli/dvc/contract'

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

const generateTestExpState = (
  rev: string,
  data: Partial<ExpData> = {},
  name?: string
): ExpState => ({
  branch: 'main',
  data: generateTestExpData({ ...data, rev }),
  name,
  rev
})

const isTestExpWithName = (
  testExp:
    | { rev: string; name: string; data: Partial<ExpData> }
    | Partial<ExpData>
): testExp is { rev: string; name: string; data: Partial<ExpData> } =>
  !!(testExp as { name: string }).name

const getExecutorState = (executor: Partial<ExecutorState>): ExecutorState => {
  if (!executor) {
    return null
  }
  return {
    local: null,
    name: Executor.WORKSPACE,
    state: ExperimentStatus.RUNNING,
    ...executor
  }
}

const generateBaselineWithExperiments = ({
  data = {},
  name,
  rev,
  testExps
}: {
  data?: Partial<ExpData>
  name?: string
  rev: string
  testExps: (
    | {
        data: Partial<ExpData>
        executor: Partial<ExecutorState>
        name: string
        rev: string
      }
    | Partial<ExpData>
  )[]
}) => {
  const experiments: ExpRange[] = []

  let i = 0
  for (const testExp of testExps) {
    i = i + 1
    if (isTestExpWithName(testExp)) {
      const { rev, data, name, executor } = testExp

      experiments.push({
        executor: getExecutorState(executor),
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
    ...generateTestExpState(rev, data, name || rev),
    experiments
  }
}

export const generateTestExpShowOutput = (
  testWorkspace: Partial<ExpData>,
  ...commits: {
    rev: string
    name?: string
    data?: Partial<ExpData>
    experiments?: (
      | {
          rev: string
          name: string
          data: Partial<ExpData>
          executor: ExecutorState
        }
      | Partial<ExpData>
    )[]
  }[]
): ExpShowOutput => {
  const output: ExpShowOutput = [
    generateTestExpState(EXPERIMENT_WORKSPACE_ID, testWorkspace)
  ]

  for (const { rev, data, name, experiments } of commits) {
    if (!experiments) {
      output.push(generateTestExpState(rev, data, name))
      continue
    }

    output.push(
      generateBaselineWithExperiments({
        data,
        name,
        rev,
        testExps: experiments
      })
    )
  }

  return output
}
