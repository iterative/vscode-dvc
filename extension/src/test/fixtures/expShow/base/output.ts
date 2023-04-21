import { join } from '../../../util/path'
import {
  EXPERIMENT_WORKSPACE_ID,
  Executor,
  ExperimentStatus,
  ExpShowOutput
} from '../../../../cli/dvc/contract'

export const ERROR_SHAS = [
  '489fd8bdaa709f7330aac342e051a9431c625481',
  'f0f918662b4f8c47819ca154a23029bf9b47d4f3',
  '55d492c9c633912685351b32df91bfe1f9ecefb9'
]

const data: ExpShowOutput = [
  {
    rev: EXPERIMENT_WORKSPACE_ID,
    data: {
      rev: EXPERIMENT_WORKSPACE_ID,
      meta: { has_checkpoints: true },
      timestamp: null,
      deps: {
        [join('data', 'data.xml')]: {
          hash: '22a1a2931c8370d3aeedd7183606fd7f',
          size: 14445097,
          nfiles: null
        },
        [join('src', 'prepare.py')]: {
          hash: 'f09ea0c15980b43010257ccb9f0055e2',
          size: 1576,
          nfiles: null
        },
        [join('data', 'prepared')]: {
          hash: '153aad06d376b6595932470e459ef42a.dir',
          size: 8437363,
          nfiles: 2
        },
        [join('src', 'featurization.py')]: {
          hash: 'e0265fc22f056a4b86d85c3056bc2894',
          size: 2490,
          nfiles: null
        },
        [join('data', 'features')]: {
          hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
          size: 2232588,
          nfiles: 2
        },
        [join('src', 'train.py')]: {
          hash: 'c3961d777cfbd7727f9fde4851896006',
          size: 967,
          nfiles: null
        },
        'model.pkl': {
          hash: '46865edbf3d62fc5c039dd9d2b0567a4',
          size: 1763725,
          nfiles: null
        },
        [join('src', 'evaluate.py')]: {
          hash: '44e714021a65edf881b1716e791d7f59',
          size: 2346,
          nfiles: null
        }
      },
      metrics: {
        'summary.json': {
          data: {
            loss: 1.775016188621521,
            accuracy: 0.5926499962806702,
            val_loss: 1.7233840227127075,
            val_accuracy: 0.6704000234603882
          }
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
          data: {
            code_names: [0, 1],
            epochs: 5,
            learning_rate: 2.1e-7,
            dvc_logs_dir: 'dvc_logs',
            log_file: 'logs.csv',
            dropout: 0.124,
            process: { threshold: 0.85 }
          }
        },
        [join('nested', 'params.yaml')]: {
          data: {
            test: true
          }
        }
      }
    }
  },
  {
    rev: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    name: 'main',
    data: {
      rev: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
      timestamp: '2020-11-21T19:58:22',
      meta: { has_checkpoints: true },
      deps: {
        [join('data', 'data.xml')]: {
          hash: '22a1a2931c8370d3aeedd7183606fd7f',
          size: 14445097,
          nfiles: null
        },
        [join('src', 'prepare.py')]: {
          hash: 'f09ea0c15980b43010257ccb9f0055e2',
          size: 1576,
          nfiles: null
        },
        [join('data', 'prepared')]: {
          hash: '153aad06d376b6595932470e459ef42a.dir',
          size: 8437363,
          nfiles: 2
        },
        [join('src', 'featurization.py')]: {
          hash: 'e0265fc22f056a4b86d85c3056bc2894',
          size: 2490,
          nfiles: null
        },
        [join('data', 'features')]: {
          hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
          size: 2232588,
          nfiles: 2
        },
        [join('src', 'train.py')]: {
          hash: 'c3961d777cfbd7727f9fde4851896006',
          size: 967,
          nfiles: null
        },
        'model.pkl': {
          hash: '46865edbf3d62fc5c039dd9d2b0567a4',
          size: 1763725,
          nfiles: null
        },
        [join('src', 'evaluate.py')]: {
          hash: '44e714021a65edf881b1716e791d7f59',
          size: 2346,
          nfiles: null
        }
      },
      metrics: {
        'summary.json': {
          data: {
            loss: 2.048856019973755,
            accuracy: 0.3484833240509033,
            val_loss: 1.9979369640350342,
            val_accuracy: 0.4277999997138977
          }
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
          data: {
            code_names: [0, 1],
            epochs: 5,
            learning_rate: 2.1e-7,
            dvc_logs_dir: 'dvc_logs',
            log_file: 'logs.csv',
            dropout: 0.122,
            process: { threshold: 0.86, test_arg: 'string' }
          }
        },
        [join('nested', 'params.yaml')]: {
          data: {
            test: true
          }
        }
      }
    },
    experiments: [
      {
        name: 'exp-e7a67',
        revs: [
          {
            rev: '4fb124aebddb2adf1545030907687fa9a4c80e70',
            name: 'exp-e7a67',
            data: {
              rev: '4fb124aebddb2adf1545030907687fa9a4c80e70',
              meta: { has_checkpoints: true },
              deps: {
                [join('data', 'data.xml')]: {
                  hash: '22a1a2931c8370d3aeedd7183606fd7f',
                  size: 14445097,
                  nfiles: null
                },
                [join('src', 'prepare.py')]: {
                  hash: 'f09ea0c15980b43010257ccb9f0055e2',
                  size: 1576,
                  nfiles: null
                },
                [join('data', 'prepared')]: {
                  hash: '153aad06d376b6595932470e459ef42a.dir',
                  size: 8437363,
                  nfiles: 2
                },
                [join('src', 'featurization.py')]: {
                  hash: 'e0265fc22f056a4b86d85c3056bc2894',
                  size: 2490,
                  nfiles: null
                },
                [join('data', 'features')]: {
                  hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                  size: 2232588,
                  nfiles: 2
                },
                [join('src', 'train.py')]: {
                  hash: 'c3961d777cfbd7727f9fde4851896006',
                  size: 967,
                  nfiles: null
                },
                'model.pkl': {
                  hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                  size: 1763725,
                  nfiles: null
                },
                [join('src', 'evaluate.py')]: {
                  hash: '44e714021a65edf881b1716e791d7f59',
                  size: 2346,
                  nfiles: null
                }
              },
              metrics: {
                'summary.json': {
                  data: {
                    loss: 2.0205044746398926,
                    accuracy: 0.3724166750907898,
                    val_loss: 1.9979370832443237,
                    val_accuracy: 0.4277999997138977
                  }
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
                  data: {
                    code_names: [0, 1],
                    epochs: 2,
                    learning_rate: 2e-12,
                    dvc_logs_dir: 'dvc_logs',
                    log_file: 'logs.csv',
                    dropout: 0.15,
                    process: { threshold: 0.86, test_arg: 3 }
                  }
                },
                [join('nested', 'params.yaml')]: {
                  data: {
                    test: true
                  }
                }
              },
              timestamp: '2020-12-29T15:31:52'
            }
          }
        ],
        executor: {
          name: Executor.DVC_TASK,
          state: ExperimentStatus.RUNNING,
          local: null
        }
      },
      {
        name: 'test-branch',
        revs: [
          {
            rev: '42b8736b08170529903cd203a1f40382a4b4a8cd',
            name: 'test-branch',
            data: {
              meta: { has_checkpoints: true },
              rev: '42b8736b08170529903cd203a1f40382a4b4a8cd',
              deps: {
                [join('data', 'data.xml')]: {
                  hash: '22a1a2931c8370d3aeedd7183606fd7f',
                  size: 14445097,
                  nfiles: null
                },
                [join('src', 'prepare.py')]: {
                  hash: 'f09ea0c15980b43010257ccb9f0055e2',
                  size: 1576,
                  nfiles: null
                },
                [join('data', 'prepared')]: {
                  hash: '153aad06d376b6595932470e459ef42a.dir',
                  size: 8437363,
                  nfiles: 2
                },
                [join('src', 'featurization.py')]: {
                  hash: 'e0265fc22f056a4b86d85c3056bc2894',
                  size: 2490,
                  nfiles: null
                },
                [join('data', 'features')]: {
                  hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                  size: 2232588,
                  nfiles: 2
                },
                [join('src', 'train.py')]: {
                  hash: 'c3961d777cfbd7727f9fde4851896006',
                  size: 967,
                  nfiles: null
                },
                'model.pkl': {
                  hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                  size: 1763725,
                  nfiles: null
                },
                [join('src', 'evaluate.py')]: {
                  hash: '44e714021a65edf881b1716e791d7f59',
                  size: 2346,
                  nfiles: null
                }
              },
              metrics: {
                'summary.json': {
                  data: {
                    loss: 1.9293040037155151,
                    accuracy: 0.4668000042438507,
                    val_loss: 1.8770883083343506,
                    val_accuracy: 0.5608000159263611
                  }
                }
              },
              params: {
                'params.yaml': {
                  data: {
                    code_names: [0, 1],
                    epochs: 2,
                    learning_rate: 2.2e-7,
                    dvc_logs_dir: 'dvc_logs',
                    log_file: 'logs.csv',
                    dropout: 0.122,
                    process: { threshold: 0.86, test_arg: 'string' }
                  }
                },
                [join('nested', 'params.yaml')]: {
                  data: {
                    test: true
                  }
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
              timestamp: '2020-12-29T15:28:59'
            }
          }
        ],
        executor: null
      },
      {
        name: 'exp-83425',
        revs: [
          {
            rev: EXPERIMENT_WORKSPACE_ID,
            name: 'exp-83425',
            data: {
              rev: EXPERIMENT_WORKSPACE_ID,
              meta: { has_checkpoints: true },
              deps: {
                [join('data', 'data.xml')]: {
                  hash: '22a1a2931c8370d3aeedd7183606fd7f',
                  size: 14445097,
                  nfiles: null
                },
                [join('src', 'prepare.py')]: {
                  hash: 'f09ea0c15980b43010257ccb9f0055e2',
                  size: 1576,
                  nfiles: null
                },
                [join('data', 'prepared')]: {
                  hash: '153aad06d376b6595932470e459ef42a.dir',
                  size: 8437363,
                  nfiles: 2
                },
                [join('src', 'featurization.py')]: {
                  hash: 'e0265fc22f056a4b86d85c3056bc2894',
                  size: 2490,
                  nfiles: null
                },
                [join('data', 'features')]: {
                  hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                  size: 2232588,
                  nfiles: 2
                },
                [join('src', 'train.py')]: {
                  hash: 'c3961d777cfbd7727f9fde4851896006',
                  size: 967,
                  nfiles: null
                },
                'model.pkl': {
                  hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                  size: 1763725,
                  nfiles: null
                },
                [join('src', 'evaluate.py')]: {
                  hash: '44e714021a65edf881b1716e791d7f59',
                  size: 2346,
                  nfiles: null
                }
              },
              metrics: {
                'summary.json': {
                  data: {
                    loss: 1.775016188621521,
                    accuracy: 0.5926499962806702,
                    val_loss: 1.7233840227127075,
                    val_accuracy: 0.6704000234603882
                  }
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
                  data: {
                    code_names: [0, 1],
                    epochs: 5,
                    learning_rate: 2.1e-7,
                    dvc_logs_dir: 'dvc_logs',
                    log_file: 'logs.csv',
                    dropout: 0.124,
                    process: { threshold: 0.85 }
                  }
                },
                [join('nested', 'params.yaml')]: {
                  data: {
                    test: true
                  }
                }
              },
              timestamp: '2020-12-29T15:27:02'
            }
          }
        ],
        executor: {
          name: Executor.WORKSPACE,
          local: null,
          state: ExperimentStatus.RUNNING
        }
      },
      {
        revs: [
          {
            rev: ERROR_SHAS[0],
            error: {
              type: 'YAMLFileCorruptedError',
              msg: "unable to read: 'params.yaml', YAML file structure is corrupted"
            }
          }
        ],
        executor: { state: ExperimentStatus.FAILED, local: null, name: null }
      },
      {
        name: 'exp-f13bca',
        revs: [
          {
            rev: ERROR_SHAS[1],
            name: 'exp-f13bca',
            data: {
              rev: ERROR_SHAS[1],
              meta: { has_checkpoints: true },
              deps: {
                [join('data', 'data.xml')]: {
                  hash: '22a1a2931c8370d3aeedd7183606fd7f',
                  size: 14445097,
                  nfiles: null
                },
                [join('src', 'prepare.py')]: {
                  hash: 'f09ea0c15980b43010257ccb9f0055e2',
                  size: 1576,
                  nfiles: null
                },
                [join('data', 'prepared')]: {
                  hash: '153aad06d376b6595932470e459ef42a.dir',
                  size: 8437363,
                  nfiles: 2
                },
                [join('src', 'featurization.py')]: {
                  hash: 'e0265fc22f056a4b86d85c3056bc2894',
                  size: 2490,
                  nfiles: null
                },
                [join('data', 'features')]: {
                  hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                  size: 2232588,
                  nfiles: 2
                },
                [join('src', 'train.py')]: {
                  hash: 'c3961d777cfbd7727f9fde4851896006',
                  size: 967,
                  nfiles: null
                },
                'model.pkl': {
                  hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                  size: 1763725,
                  nfiles: null
                },
                [join('src', 'evaluate.py')]: {
                  hash: '44e714021a65edf881b1716e791d7f59',
                  size: 2346,
                  nfiles: null
                }
              },
              metrics: {
                'summary.json': {
                  error: {
                    type: 'JSONFileCorruptedError',
                    msg: "unable to read: 'summary.json', JSON file structure is corrupted"
                  }
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
                  data: {
                    code_names: [0, 1],
                    epochs: 5,
                    learning_rate: 2.1e-7,
                    dvc_logs_dir: 'dvc_logs',
                    log_file: 'logs.csv',
                    dropout: 0.124,
                    process: { threshold: 0.85 }
                  }
                },
                [join('nested', 'params.yaml')]: {
                  data: {
                    test: true
                  }
                }
              },
              timestamp: '2020-12-29T15:26:36'
            }
          }
        ],
        executor: null
      },
      {
        revs: [
          {
            rev: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
            data: {
              rev: '90aea7f2482117a55dfcadcdb901aaa6610fbbc9',
              meta: { has_checkpoints: true },
              deps: {
                [join('data', 'data.xml')]: {
                  hash: '22a1a2931c8370d3aeedd7183606fd7f',
                  size: 14445097,
                  nfiles: null
                },
                [join('src', 'prepare.py')]: {
                  hash: 'f09ea0c15980b43010257ccb9f0055e2',
                  size: 1576,
                  nfiles: null
                },
                [join('data', 'prepared')]: {
                  hash: '153aad06d376b6595932470e459ef42a.dir',
                  size: 8437363,
                  nfiles: 2
                },
                [join('src', 'featurization.py')]: {
                  hash: 'e0265fc22f056a4b86d85c3056bc2894',
                  size: 2490,
                  nfiles: null
                },
                [join('data', 'features')]: {
                  hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                  size: 2232588,
                  nfiles: 2
                },
                [join('src', 'train.py')]: {
                  hash: 'c3961d777cfbd7727f9fde4851896006',
                  size: 967,
                  nfiles: null
                },
                'model.pkl': {
                  hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                  size: 1763725,
                  nfiles: null
                },
                [join('src', 'evaluate.py')]: {
                  hash: '44e714021a65edf881b1716e791d7f59',
                  size: 2346,
                  nfiles: null
                }
              },
              metrics: null,
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
                  data: {
                    code_names: [0, 1],
                    epochs: 5,
                    learning_rate: 2.1e-7,
                    dvc_logs_dir: 'dvc_logs',
                    log_file: 'logs.csv',
                    dropout: 0.124,
                    process: { threshold: 0.85 }
                  }
                },
                [join('nested', 'params.yaml')]: {
                  data: {
                    test: true
                  }
                }
              },
              timestamp: '2020-12-29T15:25:27'
            }
          }
        ],
        executor: {
          state: ExperimentStatus.QUEUED,
          name: Executor.DVC_TASK,
          local: {
            root: null,
            log: null,
            pid: null,
            returncode: null,
            task_id: '21ef1dd990a2751d29b2074001b520b674c509ef'
          }
        }
      },
      {
        revs: [
          {
            rev: ERROR_SHAS[2],
            data: {
              rev: ERROR_SHAS[2],
              meta: { has_checkpoints: true },
              deps: {
                [join('data', 'data.xml')]: {
                  hash: '22a1a2931c8370d3aeedd7183606fd7f',
                  size: 14445097,
                  nfiles: null
                },
                [join('src', 'prepare.py')]: {
                  hash: 'f09ea0c15980b43010257ccb9f0055e2',
                  size: 1576,
                  nfiles: null
                },
                [join('data', 'prepared')]: {
                  hash: '153aad06d376b6595932470e459ef42a.dir',
                  size: 8437363,
                  nfiles: 2
                },
                [join('src', 'featurization.py')]: {
                  hash: 'e0265fc22f056a4b86d85c3056bc2894',
                  size: 2490,
                  nfiles: null
                },
                [join('data', 'features')]: {
                  hash: 'f35d4cc2c552ac959ae602162b8543f3.dir',
                  size: 2232588,
                  nfiles: 2
                },
                [join('src', 'train.py')]: {
                  hash: 'c3961d777cfbd7727f9fde4851896006',
                  size: 967,
                  nfiles: null
                },
                'model.pkl': {
                  hash: '46865edbf3d62fc5c039dd9d2b0567a4',
                  size: 1763725,
                  nfiles: null
                },
                [join('src', 'evaluate.py')]: {
                  hash: '44e714021a65edf881b1716e791d7f59',
                  size: 2346,
                  nfiles: null
                }
              },
              metrics: {
                'metrics.json': {
                  error: {
                    msg: 'Experiment run failed.',
                    type: 'Queue failure'
                  }
                }
              },
              outs: {},
              params: {
                'params.yaml': {
                  data: {
                    code_names: [0, 2],
                    epochs: 5,
                    learning_rate: 2.1e-7,
                    dvc_logs_dir: 'dvc_logs',
                    log_file: 'logs.csv',
                    dropout: 0.125,
                    process: { threshold: 0.85 }
                  }
                },
                [join('nested', 'params.yaml')]: {
                  data: {
                    test: true
                  }
                }
              },
              timestamp: '2020-12-29T15:25:27'
            }
          }
        ],
        executor: { state: ExperimentStatus.FAILED, local: null, name: null }
      }
    ]
  }
]
export default data
