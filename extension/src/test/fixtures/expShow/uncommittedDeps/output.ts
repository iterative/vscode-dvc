import {
  ExpShowOutput,
  EXPERIMENT_WORKSPACE_ID
} from '../../../../cli/dvc/contract'

const data: ExpShowOutput = [
  {
    branch: 'current',
    rev: EXPERIMENT_WORKSPACE_ID,
    data: {
      meta: { has_checkpoints: false },
      rev: EXPERIMENT_WORKSPACE_ID,
      timestamp: null,
      params: null,
      deps: {
        data: {
          hash: null,
          size: null,
          nfiles: null
        },
        'train.py': {
          hash: null,
          size: null,
          nfiles: null
        },
        'requirements.txt': {
          hash: null,
          size: null,
          nfiles: null
        },
        model: {
          hash: null,
          size: null,
          nfiles: null
        },
        'inference.py': {
          hash: null,
          size: null,
          nfiles: null
        },
        predictions: {
          hash: null,
          size: null,
          nfiles: null
        }
      },
      outs: {
        model: {
          hash: null,
          size: null,
          nfiles: null,
          use_cache: true,
          is_data_source: false
        },
        predictions: {
          hash: null,
          size: null,
          nfiles: null,
          use_cache: true,
          is_data_source: false
        }
      },
      metrics: null
    }
  },
  {
    branch: 'current',
    rev: '852d4fbd10638ceca4de50ee68d6125b2915f23b',
    data: {
      deps: null,
      meta: { has_checkpoints: false },
      metrics: null,
      outs: null,
      params: null,
      rev: '852d4fbd10638ceca4de50ee68d6125b2915f23b',
      timestamp: '2022-08-13T09:13:15'
    },
    name: 'main'
  }
]

export default data
