import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'
import { Commit } from '../../../../experiments/webview/contract'

const data: Commit[] = [
  {
    branch: 'current',
    displayColor: undefined,
    id: EXPERIMENT_WORKSPACE_ID,
    label: EXPERIMENT_WORKSPACE_ID,
    params: {
      'params.yaml': {
        array: [true, false, 'string', 2],
        emptyString: '',
        bool2: false,
        float: 1.9293040037155151,
        negative: -123,
        string: 'string',
        bool1: true,
        zero: 0
      }
    },
    selected: false,
    starred: false
  },
  {
    branch: 'current',
    displayColor: undefined,
    id: 'main',
    label: 'main',
    selected: false,
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    starred: false,
    Created: '2020-11-21T19:58:22'
  }
]

export default data
