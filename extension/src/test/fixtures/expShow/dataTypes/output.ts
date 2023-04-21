import {
  ExpShowOutput,
  EXPERIMENT_WORKSPACE_ID
} from '../../../../cli/dvc/contract'

const data: ExpShowOutput = [
  {
    data: {
      deps: null,
      meta: { has_checkpoints: false },
      metrics: null,
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
      outs: null,
      rev: EXPERIMENT_WORKSPACE_ID,
      timestamp: null
    },
    rev: EXPERIMENT_WORKSPACE_ID
  },
  {
    data: {
      deps: null,
      meta: { has_checkpoints: false },
      metrics: null,
      outs: null,
      params: null,
      rev: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
      timestamp: '2020-11-21T19:58:22'
    },
    name: 'main',
    rev: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'
  }
]
export default data
