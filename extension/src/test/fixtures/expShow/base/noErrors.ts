import { ExpShowOutput } from '../../../../cli/dvc/contract'
import expShowFixture, { ERROR_SHAS } from './output'

const excludeErrors = (): ExpShowOutput => {
  const expShowFixtureWithoutErrors: ExpShowOutput = []

  for (const expState of expShowFixture) {
    const expStateWithoutErrors = { ...expState }
    if (expState.experiments) {
      const experiments = []
      for (const exp of expState.experiments) {
        if (!ERROR_SHAS.includes(exp.revs[0].rev)) {
          experiments.push(exp)
        }
      }
      expStateWithoutErrors.experiments = experiments
    }

    expShowFixtureWithoutErrors.push(expStateWithoutErrors)
  }

  return expShowFixtureWithoutErrors
}

const data = excludeErrors()

export default data
