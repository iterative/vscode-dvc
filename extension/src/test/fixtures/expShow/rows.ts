import { join } from '../../util/path'
import { Row } from '../../../experiments/webview/contract'
import { copyOriginalColors } from '../../../experiments/model/status/colors'
import { shortenForLabel } from '../../../util/string'

const valueWithNoChanges = (str: string) => ({
  value: shortenForLabel(str),
  changes: false
})

const colorsList = copyOriginalColors()

const data: Row[] = [
  {
    deps: {
      [join('data', 'data.xml')]: valueWithNoChanges(
        '22a1a2931c8370d3aeedd7183606fd7f'
      ),
      [join('data', 'features')]: valueWithNoChanges(
        'f35d4cc2c552ac959ae602162b8543f3.dir'
      ),
      [join('data', 'prepared')]: valueWithNoChanges(
        '153aad06d376b6595932470e459ef42a.dir'
      ),
      'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
      [join('src', 'evaluate.py')]: valueWithNoChanges(
        '44e714021a65edf881b1716e791d7f59'
      ),
      [join('src', 'featurization.py')]: valueWithNoChanges(
        'e0265fc22f056a4b86d85c3056bc2894'
      ),
      [join('src', 'prepare.py')]: valueWithNoChanges(
        '935ee6803ac617d0ef138ac33a9e9a77'
      ),
      [join('src', 'train.py')]: valueWithNoChanges(
        'c3961d777cfbd7727f9fde4851896006'
      )
    },
    displayColor: colorsList[0],
    executor: 'workspace',
    id: 'workspace',
    label: 'workspace',
    metrics: {
      'summary.json': {
        loss: 1.9293040037155151,
        accuracy: 0.4668000042438507,
        val_loss: 1.8770883083343506,
        val_accuracy: 0.5608000159263611
      }
    },
    outs: {
      [join('data', 'prepared')]: {
        hash: '153aad06d376b6595932470e459ef42a.dir',
        size: 8437363,
        nfiles: 2,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'features')]: {
        hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
        size: 2232588,
        nfiles: 2,
        use_cache: true,
        is_data_source: false
      },
      'model.pkl': {
        hash: '46865edbf3d62fc5c039dd9d2b0567a4',
        size: 1763725,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'data.xml')]: {
        hash: '22a1a2931c8370d3aeedd7183606fd7f',
        size: 14445097,
        nfiles: null,
        use_cache: true,
        is_data_source: true
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
    queued: false,
    running: true,
    selected: true,
    starred: false
  },
  {
    deps: {
      [join('data', 'data.xml')]: valueWithNoChanges(
        '22a1a2931c8370d3aeedd7183606fd7f'
      ),
      [join('data', 'features')]: valueWithNoChanges(
        'f35d4cc2c552ac959ae602162b8543f3.dir'
      ),
      [join('data', 'prepared')]: valueWithNoChanges(
        '153aad06d376b6595932470e459ef42a.dir'
      ),
      'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
      [join('src', 'evaluate.py')]: valueWithNoChanges(
        '44e714021a65edf881b1716e791d7f59'
      ),
      [join('src', 'featurization.py')]: valueWithNoChanges(
        'e0265fc22f056a4b86d85c3056bc2894'
      ),
      [join('src', 'prepare.py')]: valueWithNoChanges(
        'f09ea0c15980b43010257ccb9f0055e2'
      ),
      [join('src', 'train.py')]: valueWithNoChanges(
        'c3961d777cfbd7727f9fde4851896006'
      )
    },
    displayColor: colorsList[1],
    executor: null,
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
    name: 'main',
    outs: {
      [join('data', 'prepared')]: {
        hash: '153aad06d376b6595932470e459ef42a.dir',
        size: 8437363,
        nfiles: 2,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'features')]: {
        hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
        size: 2232588,
        nfiles: 2,
        use_cache: true,
        is_data_source: false
      },
      'model.pkl': {
        hash: '46865edbf3d62fc5c039dd9d2b0567a4',
        size: 1763725,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'data.xml')]: {
        hash: '22a1a2931c8370d3aeedd7183606fd7f',
        size: 14445097,
        nfiles: null,
        use_cache: true,
        is_data_source: true
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
    queued: false,
    running: false,
    selected: true,
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    starred: false,
    subRows: [
      {
        checkpoint_parent: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
        checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        deps: {
          [join('data', 'data.xml')]: valueWithNoChanges(
            '22a1a2931c8370d3aeedd7183606fd7f'
          ),
          [join('data', 'features')]: valueWithNoChanges(
            'f35d4cc2c552ac959ae602162b8543f3.dir'
          ),
          [join('data', 'prepared')]: valueWithNoChanges(
            '153aad06d376b6595932470e459ef42a.dir'
          ),
          'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
          [join('src', 'evaluate.py')]: valueWithNoChanges(
            '44e714021a65edf881b1716e791d7f59'
          ),
          [join('src', 'featurization.py')]: valueWithNoChanges(
            'e0265fc22f056a4b86d85c3056bc2894'
          ),
          [join('src', 'prepare.py')]: valueWithNoChanges(
            'f09ea0c15980b43010257ccb9f0055e2'
          ),
          [join('src', 'train.py')]: valueWithNoChanges(
            'c3961d777cfbd7727f9fde4851896006'
          )
        },
        displayColor: colorsList[2],
        displayNameOrParent: '[exp-e7a67]',
        executor: null,
        id: 'exp-e7a67',
        label: '4fb124a',
        logicalGroupName: '[exp-e7a67]',
        metrics: {
          'summary.json': {
            loss: 2.0205044746398926,
            accuracy: 0.3724166750907898,
            val_loss: 1.9979370832443237,
            val_accuracy: 0.4277999997138977
          }
        },
        name: 'exp-e7a67',
        outs: {
          [join('data', 'prepared')]: {
            hash: '153aad06d376b6595932470e459ef42a.dir',
            size: 8437363,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'features')]: {
            hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
            size: 2232588,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          'model.pkl': {
            hash: '46865edbf3d62fc5c039dd9d2b0567a4',
            size: 1763725,
            nfiles: null,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'data.xml')]: {
            hash: '22a1a2931c8370d3aeedd7183606fd7f',
            size: 14445097,
            nfiles: null,
            use_cache: true,
            is_data_source: true
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
        queued: false,
        running: true,
        selected: true,
        sha: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        starred: false,
        subRows: [
          {
            checkpoint_parent: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53',
            checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
            label: 'd1343a8',
            logicalGroupName: '[exp-e7a67]',
            metrics: {
              'summary.json': {
                loss: 2.0205044746398926,
                accuracy: 0.3724166750907898,
                val_loss: 1.9979370832443237,
                val_accuracy: 0.4277999997138977
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
            starred: false,
            Created: '2020-12-29T15:31:51'
          },
          {
            checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
            checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53',
            label: '1ee5f2e',
            logicalGroupName: '[exp-e7a67]',
            metrics: {
              'summary.json': {
                loss: 2.020392894744873,
                accuracy: 0.3723166584968567,
                val_loss: 1.9979370832443237,
                val_accuracy: 0.4277999997138977
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53',
            starred: false,
            Created: '2020-12-29T15:31:44'
          }
        ],
        Created: '2020-12-29T15:31:52'
      },
      {
        checkpoint_parent: '217312476f8854dda1865450b737eb6bc7a3ba1b',
        checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        deps: {
          [join('data', 'data.xml')]: valueWithNoChanges(
            '22a1a2931c8370d3aeedd7183606fd7f'
          ),
          [join('data', 'features')]: valueWithNoChanges(
            'f35d4cc2c552ac959ae602162b8543f3.dir'
          ),
          [join('data', 'prepared')]: valueWithNoChanges(
            '153aad06d376b6595932470e459ef42a.dir'
          ),
          'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
          [join('src', 'evaluate.py')]: valueWithNoChanges(
            '44e714021a65edf881b1716e791d7f59'
          ),
          [join('src', 'featurization.py')]: valueWithNoChanges(
            'e0265fc22f056a4b86d85c3056bc2894'
          ),
          [join('src', 'prepare.py')]: valueWithNoChanges(
            'f09ea0c15980b43010257ccb9f0055e2'
          ),
          [join('src', 'train.py')]: valueWithNoChanges(
            'c3961d777cfbd7727f9fde4851896006'
          )
        },
        displayColor: colorsList[3],
        displayNameOrParent: '[test-branch]',
        executor: null,
        id: 'test-branch',
        label: '42b8736',
        logicalGroupName: '[test-branch]',
        metrics: {
          'summary.json': {
            loss: 1.9293040037155151,
            accuracy: 0.4668000042438507,
            val_loss: 1.8770883083343506,
            val_accuracy: 0.5608000159263611
          }
        },
        name: 'test-branch',
        outs: {
          [join('data', 'prepared')]: {
            hash: '153aad06d376b6595932470e459ef42a.dir',
            size: 8437363,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'features')]: {
            hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
            size: 2232588,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          'model.pkl': {
            hash: '46865edbf3d62fc5c039dd9d2b0567a4',
            size: 1763725,
            nfiles: null,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'data.xml')]: {
            hash: '22a1a2931c8370d3aeedd7183606fd7f',
            size: 14445097,
            nfiles: null,
            use_cache: true,
            is_data_source: true
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
        queued: false,
        running: false,
        selected: true,
        sha: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        starred: false,
        subRows: [
          {
            checkpoint_parent: '9523bde67538cf31230efaff2dbc47d38a944ab5',
            checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: '217312476f8854dda1865450b737eb6bc7a3ba1b',
            label: '2173124',
            logicalGroupName: '[test-branch]',
            metrics: {
              'summary.json': {
                loss: 1.9293040037155151,
                accuracy: 0.4668000042438507,
                val_loss: 1.8770883083343506,
                val_accuracy: 0.5608000159263611
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            starred: false,
            sha: '217312476f8854dda1865450b737eb6bc7a3ba1b',
            Created: '2020-12-29T15:28:57'
          },
          {
            checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
            checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: '9523bde67538cf31230efaff2dbc47d38a944ab5',
            label: '9523bde',
            logicalGroupName: '[test-branch]',
            metrics: {
              'summary.json': {
                loss: 1.9882521629333496,
                accuracy: 0.4083833396434784,
                val_loss: 1.9363881349563599,
                val_accuracy: 0.4970000088214874
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: '9523bde67538cf31230efaff2dbc47d38a944ab5',
            starred: false,
            Created: '2020-12-29T15:28:50'
          }
        ],
        Created: '2020-12-29T15:28:59'
      },
      {
        checkpoint_parent: '22e40e1fa3c916ac567f69b85969e3066a91dda4',
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        deps: {
          [join('data', 'data.xml')]: valueWithNoChanges(
            '22a1a2931c8370d3aeedd7183606fd7f'
          ),
          [join('data', 'features')]: valueWithNoChanges(
            'f35d4cc2c552ac959ae602162b8543f3.dir'
          ),
          [join('data', 'prepared')]: valueWithNoChanges(
            '153aad06d376b6595932470e459ef42a.dir'
          ),
          'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
          [join('src', 'evaluate.py')]: valueWithNoChanges(
            '44e714021a65edf881b1716e791d7f59'
          ),
          [join('src', 'featurization.py')]: valueWithNoChanges(
            'e0265fc22f056a4b86d85c3056bc2894'
          ),
          [join('src', 'prepare.py')]: valueWithNoChanges(
            'f09ea0c15980b43010257ccb9f0055e2'
          ),
          [join('src', 'train.py')]: valueWithNoChanges(
            'c3961d777cfbd7727f9fde4851896006'
          )
        },
        displayColor: colorsList[4],
        displayNameOrParent: '[exp-83425]',
        id: 'exp-83425',
        executor: null,
        label: '1ba7bcd',
        logicalGroupName: '[exp-83425]',
        metrics: {
          'summary.json': {
            loss: 1.775016188621521,
            accuracy: 0.5926499962806702,
            val_loss: 1.7233840227127075,
            val_accuracy: 0.6704000234603882
          }
        },
        name: 'exp-83425',
        outs: {
          [join('data', 'prepared')]: {
            hash: '153aad06d376b6595932470e459ef42a.dir',
            size: 8437363,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'features')]: {
            hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
            size: 2232588,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          'model.pkl': {
            hash: '46865edbf3d62fc5c039dd9d2b0567a4',
            size: 1763725,
            nfiles: null,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'data.xml')]: {
            hash: '22a1a2931c8370d3aeedd7183606fd7f',
            size: 14445097,
            nfiles: null,
            use_cache: true,
            is_data_source: true
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
        queued: false,
        running: false,
        selected: true,
        sha: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        starred: false,
        subRows: [
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            checkpoint_parent: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: '22e40e1fa3c916ac567f69b85969e3066a91dda4',
            label: '22e40e1',
            logicalGroupName: '[exp-83425]',
            metrics: {
              'summary.json': {
                loss: 1.775016188621521,
                accuracy: 0.5926499962806702,
                val_loss: 1.7233840227127075,
                val_accuracy: 0.6704000234603882
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: '22e40e1fa3c916ac567f69b85969e3066a91dda4',
            starred: false,
            Created: '2020-12-29T15:27:01'
          },
          {
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            checkpoint_parent: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15',
            metrics: {
              'summary.json': {
                loss: 1.8261293172836304,
                accuracy: 0.557449996471405,
                val_loss: 1.7749212980270386,
                val_accuracy: 0.6414999961853027
              }
            },
            label: '91116c1',
            logicalGroupName: '[exp-83425]',
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15',
            starred: false,
            Created: '2020-12-29T15:26:55'
          },
          {
            checkpoint_parent: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880',
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361',
            label: 'e821416',
            logicalGroupName: '[exp-83425]',
            metrics: {
              'summary.json': {
                loss: 1.8798457384109497,
                accuracy: 0.5113166570663452,
                val_loss: 1.827923059463501,
                val_accuracy: 0.6035000085830688
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361',
            starred: false,
            Created: '2020-12-29T15:26:49'
          },
          {
            checkpoint_parent: '23250b33e3d6dd0e136262d1d26a2face031cb03',
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880',
            label: 'c658f8b',
            logicalGroupName: '[exp-83425]',
            metrics: {
              'summary.json': {
                loss: 1.9329891204833984,
                accuracy: 0.46094998717308044,
                val_loss: 1.8825950622558594,
                val_accuracy: 0.5550000071525574
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880',
            starred: false,
            Created: '2020-12-29T15:26:43'
          },
          {
            checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
            checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
            deps: {
              [join('data', 'data.xml')]: valueWithNoChanges(
                '22a1a2931c8370d3aeedd7183606fd7f'
              ),
              [join('data', 'features')]: valueWithNoChanges(
                'f35d4cc2c552ac959ae602162b8543f3.dir'
              ),
              [join('data', 'prepared')]: valueWithNoChanges(
                '153aad06d376b6595932470e459ef42a.dir'
              ),
              'model.pkl': valueWithNoChanges(
                '46865edbf3d62fc5c039dd9d2b0567a4'
              ),
              [join('src', 'evaluate.py')]: valueWithNoChanges(
                '44e714021a65edf881b1716e791d7f59'
              ),
              [join('src', 'featurization.py')]: valueWithNoChanges(
                'e0265fc22f056a4b86d85c3056bc2894'
              ),
              [join('src', 'prepare.py')]: valueWithNoChanges(
                'f09ea0c15980b43010257ccb9f0055e2'
              ),
              [join('src', 'train.py')]: valueWithNoChanges(
                'c3961d777cfbd7727f9fde4851896006'
              )
            },
            displayColor: undefined,
            executor: null,
            id: '23250b33e3d6dd0e136262d1d26a2face031cb03',
            label: '23250b3',
            logicalGroupName: '[exp-83425]',
            metrics: {
              'summary.json': {
                loss: 1.9896177053451538,
                accuracy: 0.40904998779296875,
                val_loss: 1.9391471147537231,
                val_accuracy: 0.49399998784065247
              }
            },
            outs: {
              [join('data', 'prepared')]: {
                hash: '153aad06d376b6595932470e459ef42a.dir',
                size: 8437363,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'features')]: {
                hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                size: 2232588,
                nfiles: 2,
                use_cache: true,
                is_data_source: false
              },
              'model.pkl': {
                hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                size: 1763725,
                nfiles: null,
                use_cache: true,
                is_data_source: false
              },
              [join('data', 'data.xml')]: {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                size: 14445097,
                nfiles: null,
                use_cache: true,
                is_data_source: true
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
            queued: false,
            running: false,
            selected: false,
            sha: '23250b33e3d6dd0e136262d1d26a2face031cb03',
            starred: false,
            Created: '2020-12-29T15:26:36'
          }
        ],
        Created: '2020-12-29T15:27:02'
      },
      {
        displayColor: colorsList[5],
        id: '489fd8bdaa709f7330aac342e051a9431c625481',
        label: '489fd8b',
        error:
          "unable to read: 'params.yaml', YAML file structure is corrupted",
        selected: true,
        starred: false
      },
      {
        deps: {
          [join('data', 'data.xml')]: valueWithNoChanges(
            '22a1a2931c8370d3aeedd7183606fd7f'
          ),
          [join('src', 'prepare.py')]: valueWithNoChanges(
            'f09ea0c15980b43010257ccb9f0055e2'
          ),
          [join('data', 'prepared')]: valueWithNoChanges(
            '153aad06d376b6595932470e459ef42a.dir'
          ),
          [join('src', 'featurization.py')]: valueWithNoChanges(
            'e0265fc22f056a4b86d85c3056bc2894'
          ),
          [join('data', 'features')]: valueWithNoChanges(
            'f35d4cc2c552ac959ae602162b8543f3.dir'
          ),
          [join('src', 'train.py')]: valueWithNoChanges(
            'c3961d777cfbd7727f9fde4851896006'
          ),
          'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
          [join('src', 'evaluate.py')]: valueWithNoChanges(
            '44e714021a65edf881b1716e791d7f59'
          )
        },
        displayColor: colorsList[6],
        displayNameOrParent: '[exp-f13bca]',
        executor: null,
        id: 'exp-f13bca',
        error:
          "unable to read: 'summary.json', JSON file structure is corrupted",
        label: 'f0f9186',
        logicalGroupName: '[exp-f13bca]',
        name: 'exp-f13bca',
        outs: {
          [join('data', 'prepared')]: {
            hash: '153aad06d376b6595932470e459ef42a.dir',
            size: 8437363,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'features')]: {
            hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
            size: 2232588,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          'model.pkl': {
            hash: '46865edbf3d62fc5c039dd9d2b0567a4',
            size: 1763725,
            nfiles: null,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'data.xml')]: {
            hash: '22a1a2931c8370d3aeedd7183606fd7f',
            size: 14445097,
            nfiles: null,
            use_cache: true,
            is_data_source: true
          }
        },
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
        queued: false,
        running: false,
        selected: true,
        sha: 'f0f918662b4f8c47819ca154a23029bf9b47d4f3',
        starred: false,
        Created: '2020-12-29T15:26:36'
      },
      {
        deps: {
          [join('data', 'data.xml')]: valueWithNoChanges(
            '22a1a2931c8370d3aeedd7183606fd7f'
          ),
          [join('data', 'features')]: valueWithNoChanges(
            'f35d4cc2c552ac959ae602162b8543f3.dir'
          ),
          [join('data', 'prepared')]: valueWithNoChanges(
            '153aad06d376b6595932470e459ef42a.dir'
          ),
          'model.pkl': valueWithNoChanges('46865edbf3d62fc5c039dd9d2b0567a4'),
          [join('src', 'evaluate.py')]: valueWithNoChanges(
            '44e714021a65edf881b1716e791d7f59'
          ),
          [join('src', 'featurization.py')]: valueWithNoChanges(
            'e0265fc22f056a4b86d85c3056bc2894'
          ),
          [join('src', 'prepare.py')]: valueWithNoChanges(
            'f09ea0c15980b43010257ccb9f0055e2'
          ),
          [join('src', 'train.py')]: valueWithNoChanges(
            'c3961d777cfbd7727f9fde4851896006'
          )
        },
        id: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
        label: '90aea7f',
        outs: {
          [join('data', 'prepared')]: {
            hash: '153aad06d376b6595932470e459ef42a.dir',
            size: 8437363,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'features')]: {
            hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
            size: 2232588,
            nfiles: 2,
            use_cache: true,
            is_data_source: false
          },
          'model.pkl': {
            hash: '46865edbf3d62fc5c039dd9d2b0567a4',
            size: 1763725,
            nfiles: null,
            use_cache: true,
            is_data_source: false
          },
          [join('data', 'data.xml')]: {
            hash: '22a1a2931c8370d3aeedd7183606fd7f',
            size: 14445097,
            nfiles: null,
            use_cache: true,
            is_data_source: true
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
        queued: true,
        sha: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
        starred: false,
        Created: '2020-12-29T15:25:27'
      }
    ],
    Created: '2020-11-21T19:58:22'
  }
]

export default data
