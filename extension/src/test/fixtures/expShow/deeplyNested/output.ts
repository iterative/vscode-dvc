import {
  ExpShowOutput,
  EXPERIMENT_WORKSPACE_ID
} from '../../../../cli/dvc/contract'

const data: ExpShowOutput = [
  {
    branch: 'main',
    rev: EXPERIMENT_WORKSPACE_ID,
    data: {
      deps: null,
      meta: { has_checkpoints: false },
      metrics: null,
      params: {
        'params.yaml': {
          data: {
            nested1: {
              doubled: 'first instance!',
              nested2: {
                nested3: {
                  nested4: {
                    nested5: { nested6: { nested7: 'Lucky!' } },
                    nested5b: {
                      nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                      doubled: 'second instance!'
                    }
                  }
                }
              }
            },
            outlier: 1
          }
        }
      },
      outs: null,
      rev: EXPERIMENT_WORKSPACE_ID,
      timestamp: null
    }
  },
  {
    branch: 'main',
    rev: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    data: {
      deps: null,
      meta: { has_checkpoints: false },
      metrics: null,
      params: {
        'params.yaml': {
          data: {
            nested1: {
              doubled: 'first instance!',
              nested2: {
                nested3: {
                  nested4: {
                    nested5: { nested6: { nested7: 'Lucky!' } },
                    nested5b: {
                      nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                      doubled: 'second instance!'
                    }
                  }
                }
              }
            },
            outlier: 1
          }
        }
      },
      outs: null,
      rev: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
      timestamp: '2020-11-21T19:58:22'
    },
    name: 'main'
  }
]

export default data
