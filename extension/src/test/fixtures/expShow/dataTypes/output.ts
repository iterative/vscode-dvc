import {
  ExperimentsOutput,
  ExperimentStatus
} from '../../../../cli/dvc/contract'

const data: ExperimentsOutput = {
  workspace: {
    baseline: {
      data: {
        timestamp: null,
        params: {
          'params.yaml': {
            data: {
              bool1: true,
              bool2: false,
              zero: 0,
              negative: -123,
              float: 1.9293040037155151,
              string: 'string',
              emptyString: '',
              array: [true, false, 'string', 2]
            }
          }
        },
        status: ExperimentStatus.SUCCESS,
        executor: null
      }
    }
  },
  '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
    baseline: {
      data: {
        timestamp: '2020-11-21T19:58:22',
        status: ExperimentStatus.SUCCESS,
        executor: null,
        name: 'main'
      }
    }
  }
}

export default data
