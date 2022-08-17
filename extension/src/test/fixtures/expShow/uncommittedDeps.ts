import { ExperimentsOutput } from '../../../cli/reader'

const data: ExperimentsOutput = {
  workspace: {
    baseline: {
      data: {
        timestamp: null,
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
        queued: false,
        running: false,
        executor: null,
        metrics: {}
      }
    }
  },
  '852d4fbd10638ceca4de50ee68d6125b2915f23b': {
    baseline: {
      data: {
        timestamp: '2022-08-13T09:13:15',
        deps: {},
        outs: {},
        queued: false,
        running: false,
        executor: null,
        metrics: {},
        name: 'main'
      }
    }
  }
}

export default data
