import { join } from '../../../util/path'
import { Commit } from '../../../../experiments/webview/contract'
import { copyOriginalColors } from '../../../../experiments/model/status/colors'
import { shortenForLabel } from '../../../../util/string'
import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../../../cli/dvc/contract'

const valueWithNoChanges = (str: string) => ({
  value: shortenForLabel(str),
  changes: false
})

const colorsList = copyOriginalColors()

const data: Commit[] = [
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
    executor: EXPERIMENT_WORKSPACE_ID,
    id: EXPERIMENT_WORKSPACE_ID,
    label: EXPERIMENT_WORKSPACE_ID,
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
    status: ExperimentStatus.RUNNING,
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
    displayColor: undefined,
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
    status: ExperimentStatus.SUCCESS,
    selected: false,
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
        displayColor: colorsList[1],
        displayName: '[exp-e7a67]',
        executor: 'dvc-task',
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
        status: ExperimentStatus.RUNNING,
        selected: true,
        sha: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        starred: false,
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
        displayColor: undefined,
        displayName: '[test-branch]',
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
        status: ExperimentStatus.SUCCESS,
        selected: false,
        sha: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        starred: false,
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
        displayColor: undefined,
        displayName: '[exp-83425]',
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
        status: ExperimentStatus.SUCCESS,
        selected: false,
        sha: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        starred: false,
        Created: '2020-12-29T15:27:02'
      },
      {
        displayColor: undefined,
        id: '489fd8bdaa709f7330aac342e051a9431c625481',
        label: '489fd8b',
        error:
          "unable to read: 'params.yaml', YAML file structure is corrupted",
        selected: false,
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
        displayColor: undefined,
        displayName: '[exp-f13bca]',
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
        status: ExperimentStatus.SUCCESS,
        selected: false,
        sha: 'f0f918662b4f8c47819ca154a23029bf9b47d4f3',
        starred: false,
        Created: '2020-12-29T15:26:36'
      },
      {
        displayColor: undefined,
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
        selected: false,
        status: ExperimentStatus.QUEUED,
        sha: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
        starred: false,
        Created: '2020-12-29T15:25:27'
      },
      {
        displayColor: undefined,
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
        error: 'Experiment run failed.',
        id: '55d492c9c633912685351b32df91bfe1f9ecefb9',
        label: '55d492c',
        outs: {},
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
        status: ExperimentStatus.FAILED,
        sha: '55d492c9c633912685351b32df91bfe1f9ecefb9',
        starred: false,
        Created: '2020-12-29T15:25:27'
      }
    ],
    Created: '2020-11-21T19:58:22'
  }
]

export default data
