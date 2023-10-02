import { join } from '../../../util/path'
import {
  Commit,
  GitRemoteStatus,
  StudioLinkType,
  WORKSPACE_BRANCH
} from '../../../../experiments/webview/contract'
import {
  ExecutorStatus,
  EXPERIMENT_WORKSPACE_ID,
  Executor
} from '../../../../cli/dvc/contract'

const rowsFixture: Commit[] = [
  {
    branch: WORKSPACE_BRANCH,
    commit: undefined,
    description: undefined,
    displayColor: undefined,
    executor: Executor.WORKSPACE,
    id: EXPERIMENT_WORKSPACE_ID,
    label: EXPERIMENT_WORKSPACE_ID,
    metrics: {
      'summary.json': {
        loss: 1.775016188621521,
        accuracy: 0.5926499962806702,
        val_loss: 1.7233840227127075,
        val_accuracy: 0.6704000234603882
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.124,
        process: { threshold: 0.85 }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    executorStatus: ExecutorStatus.RUNNING,
    selected: false,
    starred: false
  },
  {
    commit: {
      author: 'Julie G',
      date: '5 days ago',
      message: 'Drop checkpoint: true (#74)\n\n',
      tags: []
    },
    description: 'Drop checkpoint: true (#74)\n\n',
    displayColor: undefined,
    flatBranches: ['main'],
    id: 'fe2919b',
    label: 'fe2919b',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033,
        val_loss: 1.9979369640350342,
        val_accuracy: 0.4277999997138977
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 10,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.122,
        process: { threshold: 0.86, test_arg: 'string' }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: false,
    sha: 'fe2919bb4394b30494bea905c253e10077b9a1bd',
    starred: false,
    Created: '2020-11-16T19:58:22'
  },
  {
    commit: {
      author: 'Matt Seddon',
      date: '3 days ago',
      message: 'Update dependency dvclive to v2.6.4 (#75)\n\n',
      tags: []
    },
    description: 'Update dependency dvclive to v2.6.4 (#75)\n\n',
    displayColor: undefined,
    flatBranches: ['main'],
    id: '7df876c',
    label: '7df876c',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033,
        val_loss: 1.9979369640350342,
        val_accuracy: 0.4277999997138977
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 7,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.122,
        process: { threshold: 0.86, test_arg: 'string' }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: false,
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    starred: false,
    Created: '2020-11-18T19:58:22'
  },
  {
    commit: {
      author: 'github-actions[bot]',
      date: '6 hours ago',
      message:
        'Update version and CHANGELOG for release (#4022)\n\nCo-authored-by: Olivaw[bot] <olivaw@iterative.ai>',
      tags: ['0.9.3']
    },
    description: 'Update version and CHANGELOG for release (#4022) ...',
    displayColor: undefined,
    flatBranches: ['main'],
    id: 'main',
    label: 'main',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033,
        val_loss: 1.9979369640350342,
        val_accuracy: 0.4277999997138977
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.122,
        process: { threshold: 0.86, test_arg: 'string' }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: false,
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    starred: false,
    Created: '2020-11-21T19:58:22'
  },
  {
    baselineSha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    displayColor: undefined,
    description: '[exp-83425]',
    executor: Executor.WORKSPACE,
    flatBranches: ['main'],
    id: 'exp-83425',
    label: EXPERIMENT_WORKSPACE_ID,
    metrics: {
      'summary.json': {
        loss: 1.775016188621521,
        accuracy: 0.5926499962806702,
        val_loss: 1.7233840227127075,
        val_accuracy: 0.6704000234603882
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.124,
        process: { threshold: 0.85 }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: true,
    starred: false,
    executorStatus: ExecutorStatus.RUNNING,
    Created: '2020-12-29T15:27:02'
  },
  {
    baselineSha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    displayColor: undefined,
    description: '[exp-f13bca]',
    id: 'exp-f13bca',
    error: "unable to read: 'summary.json', JSON file structure is corrupted",
    flatBranches: ['main'],
    label: 'f0f9186',
    metrics: {},
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.124,
        process: { threshold: 0.85 }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    gitRemoteStatus: GitRemoteStatus.NOT_ON_REMOTE,
    selected: false,
    sha: 'f0f918662b4f8c47819ca154a23029bf9b47d4f3',
    starred: false,
    Created: '2020-12-29T15:26:36'
  },
  {
    baselineSha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    displayColor: undefined,
    error: 'Experiment run failed.',
    flatBranches: ['main'],
    id: '55d492c',
    label: '55d492c',
    metrics: {},
    params: {
      'params.yaml': {
        code_names: [0, 2],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.125,
        process: { threshold: 0.85 }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: false,
    executorStatus: ExecutorStatus.FAILED,
    sha: '55d492c9c633912685351b32df91bfe1f9ecefb9',
    starred: false,
    Created: '2020-12-29T15:25:27'
  },
  {
    commit: {
      author: 'Julie G',
      date: '6 hours ago',
      message:
        'Improve "Get Started" walkthrough (#4020)\n\n* don\'t show walkthrough in sidebar welcome section\n* move admonition in command palette walkthrough step',
      tags: []
    },
    description: 'Improve "Get Started" walkthrough (#4020) ...',
    displayColor: undefined,
    flatBranches: ['main', 'other-branch'],
    id: 'other-branch',
    label: 'other-branch',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033,
        val_loss: 1.9979369640350342,
        val_accuracy: 0.4277999997138977
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.122,
        process: { threshold: 0.86, test_arg: 'string' }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: false,
    sha: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
    starred: false,
    Created: '2020-11-21T19:58:22'
  },
  {
    commit: {
      author: 'Matt Seddon',
      date: '8 hours ago',
      message:
        'Add capabilities to text mentioning storage provider extensions (#4015)\n',
      tags: []
    },
    description:
      'Add capabilities to text mentioning storage provider extensions (#4015)',
    displayColor: undefined,
    flatBranches: ['main', 'other-branch', 'another-branch'],
    id: 'another-branch',
    label: 'another-branch',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033,
        val_loss: 1.9979369640350342,
        val_accuracy: 0.4277999997138977
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 5,
        learning_rate: 2.1e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.122,
        process: { threshold: 0.86, test_arg: 'string' }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    selected: false,
    sha: '55d492c9c633912685351b32df91bfe1f9ecefb9',
    starred: false,
    Created: '2020-11-21T19:58:22'
  },
  {
    baselineSha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    displayColor: undefined,
    description: '[exp-e7a67]',
    executor: Executor.DVC_TASK,
    flatBranches: ['main'],
    id: 'exp-e7a67',
    label: '4fb124a',
    metrics: {
      'summary.json': {
        loss: 2.0205044746398926,
        accuracy: 0.3724166750907898,
        val_loss: 1.9979370832443237,
        val_accuracy: 0.4277999997138977
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 2,
        learning_rate: 2e-12,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.15,
        process: { threshold: 0.86, test_arg: 3 }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    executorStatus: ExecutorStatus.RUNNING,
    selected: false,
    sha: '4fb124aebddb2adf1545030907687fa9a4c80e70',
    starred: false,
    Created: '2020-12-29T15:31:52'
  },
  {
    baselineSha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    displayColor: undefined,
    description: '[test-branch]',
    flatBranches: ['main'],
    id: 'test-branch',
    label: '42b8736',
    metrics: {
      'summary.json': {
        loss: 1.9293040037155151,
        accuracy: 0.4668000042438507,
        val_loss: 1.8770883083343506,
        val_accuracy: 0.5608000159263611
      }
    },
    params: {
      'params.yaml': {
        code_names: [0, 1],
        epochs: 2,
        learning_rate: 2.2e-7,
        dvc_logs_dir: 'dvc_logs',
        log_file: 'logs.csv',
        dropout: 0.122,
        process: { threshold: 0.86, test_arg: 'string' }
      },
      [join('nested', 'params.yaml')]: {
        test: true
      }
    },
    gitRemoteStatus: GitRemoteStatus.ON_REMOTE,
    studioLinkType: StudioLinkType.PUSHED,
    selected: false,
    sha: '42b8736b08170529903cd203a1f40382a4b4a8cd',
    starred: false,
    Created: '2020-12-29T15:28:59'
  },
  {
    baselineSha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    displayColor: undefined,
    flatBranches: ['main'],
    id: '489fd8b',
    sha: '489fd8bdaa709f7330aac342e051a9431c625481',
    label: '489fd8b',
    error: "unable to read: 'params.yaml', YAML file structure is corrupted",
    selected: false,
    starred: false,
    executorStatus: ExecutorStatus.FAILED
  }
]

export default rowsFixture
