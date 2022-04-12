import { join } from 'dvc/src/test/util/path'
import { RowData } from 'dvc/src/experiments/webview/contract'
import { copyOriginalExperimentColors } from 'dvc/src/experiments/model/colors'

const colorsList = copyOriginalExperimentColors()

const data: RowData[] = [
  {
    timestamp: null,
    params: {
      'params.yaml': {
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
    queued: false,
    running: true,
    executor: 'workspace',
    metrics: {
      'summary.json': {
        loss: 1.9293040037155151,
        accuracy: 0.4668000042438507,
        val_loss: 1.8770883083343506,
        val_accuracy: 0.5608000159263611
      }
    },
    displayColor: '#945dd6',
    label: 'workspace',
    mutable: false,
    selected: true,
    id: 'workspace'
  },
  {
    timestamp: '2020-11-21T19:58:22',
    params: {
      'params.yaml': {
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
    queued: false,
    running: false,
    executor: null,
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033,
        val_loss: 1.9979369640350342,
        val_accuracy: 0.4277999997138977
      }
    },
    id: 'main',
    name: 'main',
    label: 'main',
    mutable: false,
    displayColor: '#13adc7',
    selected: true,
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    subRows: [
      {
        checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        timestamp: '2020-12-29T15:31:52',
        params: {
          'params.yaml': {
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
        queued: false,
        running: true,
        executor: null,
        metrics: {
          'summary.json': {
            loss: 2.0205044746398926,
            accuracy: 0.3724166750907898,
            val_loss: 1.9979370832443237,
            val_accuracy: 0.4277999997138977
          }
        },
        name: 'exp-e7a67',
        checkpoint_parent: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
        label: '4fb124a',
        mutable: false,
        displayNameOrParent: '[exp-e7a67]',
        displayColor: colorsList[0],
        id: 'exp-e7a67',
        sha: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        subRows: [
          {
            checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
            timestamp: '2020-12-29T15:31:51',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 2.0205044746398926,
                accuracy: 0.3724166750907898,
                val_loss: 1.9979370832443237,
                val_accuracy: 0.4277999997138977
              }
            },
            checkpoint_parent: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53',
            label: 'd1343a8',
            mutable: false,
            displayColor: colorsList[0],
            id: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
            selected: false,
            sha: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9'
          },
          {
            checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
            timestamp: '2020-12-29T15:31:44',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 2.020392894744873,
                accuracy: 0.3723166584968567,
                val_loss: 1.9979370832443237,
                val_accuracy: 0.4277999997138977
              }
            },
            checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
            displayColor: colorsList[0],
            label: '1ee5f2e',
            mutable: false,
            id: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53',
            selected: false,
            sha: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53'
          }
        ],
        selected: true
      },
      {
        checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        timestamp: '2020-12-29T15:28:59',
        params: {
          'params.yaml': {
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
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'summary.json': {
            loss: 1.9293040037155151,
            accuracy: 0.4668000042438507,
            val_loss: 1.8770883083343506,
            val_accuracy: 0.5608000159263611
          }
        },
        name: 'test-branch',
        checkpoint_parent: '217312476f8854dda1865450b737eb6bc7a3ba1b',
        displayColor: colorsList[1],
        label: '42b8736',
        mutable: false,
        displayNameOrParent: '[test-branch]',
        id: 'test-branch',
        sha: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        subRows: [
          {
            checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
            timestamp: '2020-12-29T15:28:57',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.9293040037155151,
                accuracy: 0.4668000042438507,
                val_loss: 1.8770883083343506,
                val_accuracy: 0.5608000159263611
              }
            },
            checkpoint_parent: '9523bde67538cf31230efaff2dbc47d38a944ab5',
            displayColor: colorsList[1],
            label: '2173124',
            mutable: false,
            id: '217312476f8854dda1865450b737eb6bc7a3ba1b',
            selected: false,
            sha: '217312476f8854dda1865450b737eb6bc7a3ba1b'
          },
          {
            checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
            timestamp: '2020-12-29T15:28:50',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.9882521629333496,
                accuracy: 0.4083833396434784,
                val_loss: 1.9363881349563599,
                val_accuracy: 0.4970000088214874
              }
            },
            checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
            displayColor: colorsList[1],
            label: '9523bde',
            mutable: false,
            id: '9523bde67538cf31230efaff2dbc47d38a944ab5',
            selected: false,
            sha: '9523bde67538cf31230efaff2dbc47d38a944ab5'
          }
        ],
        selected: true
      },
      {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        timestamp: '2020-12-29T15:27:02',
        params: {
          'params.yaml': {
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
        queued: false,
        running: false,
        executor: null,
        metrics: {
          'summary.json': {
            loss: 1.775016188621521,
            accuracy: 0.5926499962806702,
            val_loss: 1.7233840227127075,
            val_accuracy: 0.6704000234603882
          }
        },
        name: 'exp-83425',
        checkpoint_parent: '22e40e1fa3c916ac567f69b85969e3066a91dda4',
        displayColor: colorsList[2],
        label: '1ba7bcd',
        mutable: false,
        displayNameOrParent: '[exp-83425]',
        id: 'exp-83425',
        sha: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        subRows: [
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            timestamp: '2020-12-29T15:27:01',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.775016188621521,
                accuracy: 0.5926499962806702,
                val_loss: 1.7233840227127075,
                val_accuracy: 0.6704000234603882
              }
            },
            checkpoint_parent: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15',
            displayColor: colorsList[2],
            label: '22e40e1',
            mutable: false,
            id: '22e40e1fa3c916ac567f69b85969e3066a91dda4',
            selected: false,
            sha: '22e40e1fa3c916ac567f69b85969e3066a91dda4'
          },
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            timestamp: '2020-12-29T15:26:55',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.8261293172836304,
                accuracy: 0.557449996471405,
                val_loss: 1.7749212980270386,
                val_accuracy: 0.6414999961853027
              }
            },
            checkpoint_parent: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361',
            displayColor: colorsList[2],
            label: '91116c1',
            mutable: false,
            id: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15',
            selected: false,
            sha: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15'
          },
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            timestamp: '2020-12-29T15:26:49',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.8798457384109497,
                accuracy: 0.5113166570663452,
                val_loss: 1.827923059463501,
                val_accuracy: 0.6035000085830688
              }
            },
            checkpoint_parent: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880',
            displayColor: colorsList[2],
            label: 'e821416',
            mutable: false,
            id: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361',
            selected: false,
            sha: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361'
          },
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            timestamp: '2020-12-29T15:26:43',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.9329891204833984,
                accuracy: 0.46094998717308044,
                val_loss: 1.8825950622558594,
                val_accuracy: 0.5550000071525574
              }
            },
            checkpoint_parent: '23250b33e3d6dd0e136262d1d26a2face031cb03',
            displayColor: colorsList[2],
            label: 'c658f8b',
            mutable: false,
            id: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880',
            selected: false,
            sha: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880'
          },
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            timestamp: '2020-12-29T15:26:36',
            params: {
              'params.yaml': {
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
            queued: false,
            running: false,
            executor: null,
            metrics: {
              'summary.json': {
                loss: 1.9896177053451538,
                accuracy: 0.40904998779296875,
                val_loss: 1.9391471147537231,
                val_accuracy: 0.49399998784065247
              }
            },
            checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
            displayColor: colorsList[2],
            label: '23250b3',
            mutable: false,
            id: '23250b33e3d6dd0e136262d1d26a2face031cb03',
            selected: false,
            sha: '23250b33e3d6dd0e136262d1d26a2face031cb03'
          }
        ],
        selected: true
      },
      {
        timestamp: '2020-12-29T15:25:27',
        params: {
          'params.yaml': {
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
        queued: true,
        label: '90aea7f',
        mutable: false,
        id: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
        sha: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9'
      }
    ]
  }
]

export default data
