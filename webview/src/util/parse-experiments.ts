import {
  ExperimentsRepoJSONOutput,
  ExperimentFields
} from 'dvc/src/experiments/contract'

export interface ExperimentWithSubRows extends ExperimentFields {
  id: string
  subRows?: ExperimentWithSubRows[]
}

export type RepoExperiments = Array<ExperimentWithSubRows>

interface ParseExperimentsOutput {
  experiments: ExperimentWithSubRows[]
  flatExperiments: ExperimentWithSubRows[]
}

const addIdToExperiment: (
  id: string,
  experiment: ExperimentFields
) => ExperimentWithSubRows = (id, experiment) => ({
  ...experiment,
  id
})

const buildExperimentFromEntry: (
  entry: [string, ExperimentFields]
) => ExperimentWithSubRows = ([id, experiment]) =>
  addIdToExperiment(id, experiment)

const isTopLevelExperiment: (row: ExperimentWithSubRows) => boolean = ({
  queued,
  id,
  checkpoint_tip
}) => queued || (checkpoint_tip ? id === checkpoint_tip : true)

const pushResult = (
  currentTip: ExperimentWithSubRows | undefined,
  currentEpochs: ExperimentWithSubRows[],
  result: ExperimentWithSubRows[]
): void => {
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

const groupCheckpoints = (
  rows: ExperimentWithSubRows[]
): ExperimentWithSubRows[] => {
  let currentTip: ExperimentWithSubRows | undefined
  let currentEpochs: ExperimentWithSubRows[] = []
  const result: ExperimentWithSubRows[] = []

  for (const row of rows) {
    if (isTopLevelExperiment(row)) {
      pushResult(currentTip, currentEpochs, result)
      currentTip = row
      currentEpochs = []
    } else {
      currentEpochs.push({ ...row })
    }
  }
  pushResult(currentTip, currentEpochs, result)
  return result
}

const parseExperiments: (
  experimentsData: ExperimentsRepoJSONOutput
) => ParseExperimentsOutput = experimentsData => {
  return Object.entries(experimentsData).reduce<ParseExperimentsOutput>(
    (
      { experiments, flatExperiments },
      [commitId, { baseline, ...childExperiments }]
    ) => {
      const parsedChildExperiments: ExperimentWithSubRows[] = Object.entries(
        childExperiments
      ).map<ExperimentWithSubRows>(buildExperimentFromEntry)
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
}

export default parseExperiments
