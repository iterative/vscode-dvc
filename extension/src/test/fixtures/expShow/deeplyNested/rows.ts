import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../../../cli/dvc/contract'

export const data = [
  {
    id: EXPERIMENT_WORKSPACE_ID,
    label: EXPERIMENT_WORKSPACE_ID,
    executor: null,
    params: {
      'params.yaml': {
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
    },
    displayColor: undefined,
    selected: false,
    status: ExperimentStatus.SUCCESS,
    starred: false
  },
  {
    id: 'main',
    label: 'main',
    Created: '2020-11-21T19:58:22',
    status: ExperimentStatus.SUCCESS,
    executor: null,
    name: 'main',
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    params: {
      'params.yaml': {
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
    },
    displayColor: undefined,
    selected: false,
    starred: false
  }
]

export default data
