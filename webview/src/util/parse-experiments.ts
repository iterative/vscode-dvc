import {
  DataDictRoot,
  ExperimentsRepoJSONOutput,
  ExperimentJSONOutput
} from 'dvc/src/webviewContract'

export interface Experiment {
  id: string
  name?: string
  timestamp?: string | Date | null
  params?: DataDictRoot
  metrics?: DataDictRoot
  queued?: boolean
  checkpoint_tip?: string
  checkpoint_parent?: string
}

export interface ExperimentRow extends Experiment {
  subRows?: ExperimentRow[]
}

export type RepoExperiments = Array<Experiment>

interface ParseExperimentsOutput {
  experiments: Experiment[]
  flatExperiments: Experiment[]
}

const addIdToExperiment: (
  id: string,
  experiment: ExperimentJSONOutput
) => ExperimentRow = (id, experiment) => ({
  ...experiment,
  id
})

const buildExperimentFromEntry: (
  entry: [string, ExperimentJSONOutput]
) => ExperimentRow = ([id, experiment]) => addIdToExperiment(id, experiment)

const isExperiment: (row: Experiment) => boolean = row =>
  row.queued || row.id === row.checkpoint_tip

const groupCheckpoints: (rows: ExperimentRow[]) => Experiment[] = rows => {
  let currentTip: ExperimentRow | undefined
  let currentEpochs: ExperimentRow[] = []
  const result: ExperimentRow[] = []
  const pushResult: () => void = () => {
    if (currentTip) {
      const resultToPush = {
        ...currentTip
      }
      if (currentEpochs.length > 0) resultToPush.subRows = currentEpochs
      result.push(resultToPush)
    }
  }
  for (const row of rows) {
    if (isExperiment(row)) {
      pushResult()
      currentTip = row
      currentEpochs = []
    } else {
      currentEpochs.push({ ...row })
    }
  }
  pushResult()
  return result
}

const parseExperiments: (
  experimentsData: ExperimentsRepoJSONOutput
) => ParseExperimentsOutput = experimentsData => {
  const parsedEntries = Object.entries(experimentsData).reduce<
    ParseExperimentsOutput
  >(
    (
      { experiments, flatExperiments },
      [commitId, { baseline, ...childExperiments }]
    ) => {
      const parsedChildExperiments: ExperimentRow[] = Object.entries(
        childExperiments
      ).map<ExperimentRow>(buildExperimentFromEntry)
      const baselineEntry = addIdToExperiment(commitId, baseline)
      return {
        experiments: [
          ...experiments,
          {
            ...baselineEntry,
            subRows: groupCheckpoints(parsedChildExperiments)
          }
        ],
        flatExperiments: [
          ...flatExperiments,
          baselineEntry,
          ...parsedChildExperiments
        ]
      }
    },
    {
      experiments: [],
      flatExperiments: []
    }
  )
  return parsedEntries
}

export default parseExperiments
