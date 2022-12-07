import {
  ExperimentsOutput,
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../../../cli/dvc/contract'

const data: ExperimentsOutput = {
  [EXPERIMENT_WORKSPACE_ID]: {
    baseline: {
      data: {
        timestamp: null,
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
        status: ExperimentStatus.SUCCESS,
        executor: null
      }
    }
  },
  '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
    baseline: {
      data: {
        timestamp: '2020-11-21T19:58:22',
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
        status: ExperimentStatus.SUCCESS,
        executor: null,
        name: 'main'
      }
    }
  }
}

export default data
