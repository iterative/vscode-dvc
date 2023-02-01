import {
  ExperimentFieldsOrError,
  ExperimentsOutput
} from '../../../../cli/dvc/contract'
import expShowFixture, { errorShas } from './output'

const excludeErrors = (): ExperimentsOutput => {
  const { workspace, ...commitsObject } = expShowFixture
  const expShowFixtureWithoutErrors: ExperimentsOutput = { workspace }

  for (const [sha, { baseline, ...experimentsObject }] of Object.entries(
    commitsObject
  )) {
    const experiments: { [sha: string]: ExperimentFieldsOrError } = {}
    for (const [sha, experiment] of Object.entries(experimentsObject)) {
      if (!errorShas.includes(sha)) {
        experiments[sha] = experiment
      }
    }
    expShowFixtureWithoutErrors[sha] = { baseline, ...experiments }
  }
  return expShowFixtureWithoutErrors
}

const data = excludeErrors()

export default data
