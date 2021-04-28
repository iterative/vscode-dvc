import {
  ExperimentsRepoJSONOutput,
  ExperimentJSONOutput
} from 'dvc/src/webviews/experiments/contract'

export interface ExperimentWithId extends ExperimentJSONOutput {
  id: string
}

export interface Experiment extends ExperimentWithId {
  subRows?: Experiment[]
}

export type RepoExperiments = Array<ExperimentWithId>

interface ParseExperimentsOutput {
  experiments: ExperimentWithId[]
  flatExperiments: ExperimentWithId[]
}

const addIdToExperiment: (
  id: string,
  experiment: ExperimentJSONOutput
) => Experiment = (id, experiment) => ({
  ...experiment,
  id
})

const buildExperimentFromEntry: (
  entry: [string, ExperimentJSONOutput]
) => Experiment = ([id, experiment]) => addIdToExperiment(id, experiment)

const isTopLevelExperiment: (row: ExperimentWithId) => boolean = ({
  queued,
  id,
  checkpoint_tip
}) => queued || (checkpoint_tip ? id === checkpoint_tip : true)

const groupCheckpoints: (rows: Experiment[]) => Experiment[] = rows => {
  let currentTip: Experiment | undefined
  let currentEpochs: Experiment[] = []
  const result: Experiment[] = []
  const pushResult: () => void = () => {
    if (currentTip) {
      const resultToPush = {
        ...currentTip
      }
      if (currentEpochs.length > 0) {
        resultToPush.subRows = currentEpochs
      }
      result.push(resultToPush)
    }
  }
  for (const row of rows) {
    if (isTopLevelExperiment(row)) {
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
      const parsedChildExperiments: Experiment[] = Object.entries(
        childExperiments
      ).map<Experiment>(buildExperimentFromEntry)
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
