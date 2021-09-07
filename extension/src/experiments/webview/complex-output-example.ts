/* eslint-disable sonarjs/no-duplicate-string, no-loss-of-precision */
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

const data: ExperimentsRepoJSONOutput = {
  '42b8736b08170529903cd203a1f40382a4b4a8cd': {
    baseline: {
      data: {
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.4668000042438507,
              loss: 1.9293040037155151,
              val_accuracy: 0.5608000159263611,
              val_loss: 1.8770883083343506
            }
          }
        },
        name: 'test-branch',
        params: {
          'params.yaml': {
            data: {
              dropout: 0.122,
              dvc_logs_dir: 'dvc_logs',
              epochs: 2,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        running: false,
        timestamp: '2020-12-29T15:28:59'
      }
    },
    d3f4a0d3661c5977540d2205d819470cf0d2145a: {
      data: {
        checkpoint_tip: 'd3f4a0d3661c5977540d2205d819470cf0d2145a',
        checkpoint_parent: 'f0778b3eb6a390d6f6731c735a2a4561d1792c3a',
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.5672000050544739,
              loss: 1.8168506622314453,
              val_accuracy: 0.6463000178337097,
              val_loss: 1.7643483877182007
            }
          }
        },
        name: 'exp-05694',
        params: {
          'params.yaml': {
            data: {
              dropout: 0.122,
              dvc_logs_dir: 'dvc_logs',
              epochs: 2,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        running: false,
        timestamp: '2021-01-14T10:58:00'
      }
    },
    f0778b3eb6a390d6f6731c735a2a4561d1792c3a: {
      data: {
        checkpoint_parent: 'f81f1b5a1248b9d9f595fb53136298c69f908e66',
        checkpoint_tip: 'd3f4a0d3661c5977540d2205d819470cf0d2145a',
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.5672000050544739,
              loss: 1.6168506622314453,
              val_accuracy: 0.6463000178337097,
              val_loss: 1.7643483877182007
            }
          }
        },
        params: {
          'params.yaml': {
            data: {
              dropout: 0.122,
              dvc_logs_dir: 'dvc_logs',
              epochs: 2,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        running: false,
        timestamp: '2021-01-14T10:57:59'
      }
    },
    f81f1b5a1248b9d9f595fb53136298c69f908e66: {
      data: {
        checkpoint_parent: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        checkpoint_tip: 'd3f4a0d3661c5977540d2205d819470cf0d2145a',
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.5202666521072388,
              loss: 1.8722929954528809,
              val_accuracy: 0.6096000075340271,
              val_loss: 1.8196595907211304
            }
          }
        },
        params: {
          'params.yaml': {
            data: {
              dropout: 0.122,
              dvc_logs_dir: 'dvc_logs',
              epochs: 2,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        running: false,
        timestamp: '2021-01-14T10:57:53'
      }
    }
  },
  '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
    '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d': {
      data: {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        params: {
          'params.yaml': {
            data: {
              epochs: 5,
              dvc_logs_dir: 'dvc_logs',
              learning_rate: 2.1e-7,
              dropout: 0.124,
              log_file: 'logs.csv',
              process: { threshold: 0.85 }
            }
          }
        },
        queued: false,
        timestamp: '2020-12-29T15:27:02',
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.5926499962806702,
              loss: 1.775016188621521,
              val_accuracy: 0.6704000234603882,
              val_loss: 1.7233840227127075
            }
          }
        },
        running: false,
        checkpoint_parent: '22e40e1fa3c916ac567f69b85969e3066a91dda4',
        name: 'exp-83425'
      }
    },
    '1ee5f2ecb0fa4d83cbf614386536344cf894dd53': {
      data: {
        checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        executor: null,
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              dropout: 0.15,
              epochs: 2,
              learning_rate: 2e-12,
              log_file: 'logs.csv',
              process: { test_arg: 3, threshold: 0.86 }
            }
          }
        },
        checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        queued: false,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.3723166584968567,
              loss: 2.020392894744873,
              val_accuracy: 0.4277999997138977,
              val_loss: 1.9979370832443237
            }
          }
        },
        timestamp: '2020-12-29T15:31:44',
        running: false
      }
    },
    '217312476f8854dda1865450b737eb6bc7a3ba1b': {
      data: {
        checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              dropout: 0.122,
              epochs: 2,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        executor: null,
        queued: false,
        checkpoint_parent: '9523bde67538cf31230efaff2dbc47d38a944ab5',
        timestamp: '2020-12-29T15:28:57',
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.4668000042438507,
              loss: 1.9293040037155151,
              val_accuracy: 0.5608000159263611,
              val_loss: 1.8770883083343506
            }
          }
        },
        running: false
      }
    },
    '22e40e1fa3c916ac567f69b85969e3066a91dda4': {
      data: {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              dropout: 0.124,
              epochs: 5,
              learning_rate: 2.1e-7,
              log_file: 'logs.csv',
              process: { threshold: 0.85 }
            }
          }
        },
        executor: null,
        queued: false,
        checkpoint_parent: '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15',
        timestamp: '2020-12-29T15:27:01',
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.5926499962806702,
              loss: 1.775016188621521,
              val_accuracy: 0.6704000234603882,
              val_loss: 1.7233840227127075
            }
          }
        },
        running: false
      }
    },
    '23250b33e3d6dd0e136262d1d26a2face031cb03': {
      data: {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        params: {
          'params.yaml': {
            data: {
              epochs: 5,
              learning_rate: 2.1e-7,
              dvc_logs_dir: 'dvc_logs',
              log_file: 'logs.csv',
              dropout: 0.124,
              process: { threshold: 0.85 }
            }
          }
        },
        timestamp: '2020-12-29T15:26:36',
        queued: false,
        executor: null,
        running: false,
        checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        metrics: {
          'summary.json': {
            data: {
              loss: 1.9896177053451538,
              accuracy: 0.40904998779296875,
              val_loss: 1.9391471147537231,
              val_accuracy: 0.49399998784065247
            }
          }
        }
      }
    },
    '42b8736b08170529903cd203a1f40382a4b4a8cd': {
      data: {
        checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        params: {
          'params.yaml': {
            data: {
              epochs: 2,
              dvc_logs_dir: 'dvc_logs',
              learning_rate: 2.2e-7,
              dropout: 0.122,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        timestamp: '2020-12-29T15:28:59',
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.4668000042438507,
              loss: 1.9293040037155151,
              val_accuracy: 0.5608000159263611,
              val_loss: 1.8770883083343506
            }
          }
        },
        running: false,
        checkpoint_parent: '217312476f8854dda1865450b737eb6bc7a3ba1b',
        name: 'test-branch'
      }
    },
    '4fb124aebddb2adf1545030907687fa9a4c80e70': {
      data: {
        checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        params: {
          'params.yaml': {
            data: {
              epochs: 2,
              dvc_logs_dir: 'dvc_logs',
              learning_rate: 2e-12,
              dropout: 0.15,
              log_file: 'logs.csv',
              process: { test_arg: 3, threshold: 0.86 }
            }
          }
        },
        queued: false,
        timestamp: '2020-12-29T15:31:52',
        executor: null,
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.3724166750907898,
              loss: 2.0205044746398926,
              val_accuracy: 0.4277999997138977,
              val_loss: 1.9979370832443237
            }
          }
        },
        running: true,
        checkpoint_parent: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
        name: 'exp-e7a67'
      }
    },
    '90aea7f2482117a55dfcadcdb901aaa6610fbbc9': {
      data: {
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              epochs: 5,
              dropout: 0.124,
              learning_rate: 2.1e-7,
              log_file: 'logs.csv',
              process: { threshold: 0.85 }
            }
          }
        },
        queued: true,
        timestamp: '2020-12-29T15:25:27'
      }
    },
    '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15': {
      data: {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              dropout: 0.124,
              epochs: 5,
              learning_rate: 2.1e-7,
              log_file: 'logs.csv',
              process: { threshold: 0.85 }
            }
          }
        },
        executor: null,
        queued: false,
        checkpoint_parent: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361',
        timestamp: '2020-12-29T15:26:55',
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.557449996471405,
              loss: 1.8261293172836304,
              val_accuracy: 0.6414999961853027,
              val_loss: 1.7749212980270386
            }
          }
        },
        running: false
      }
    },
    baseline: {
      data: {
        timestamp: '2020-11-21T19:58:22',
        params: {
          'params.yaml': {
            data: {
              epochs: 5,
              learning_rate: 2.1e-7,
              dvc_logs_dir: 'dvc_logs',
              log_file: 'logs.csv',
              dropout: 0.124,
              process: { threshold: 0.85 }
            }
          }
        },
        queued: false,
        running: false,
        executor: null,
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
        name: 'master'
      }
    },
    '9523bde67538cf31230efaff2dbc47d38a944ab5': {
      data: {
        checkpoint_tip: '42b8736b08170529903cd203a1f40382a4b4a8cd',
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              epochs: 2,
              dropout: 0.122,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        executor: null,
        timestamp: '2020-12-29T15:28:50',
        checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.4083833396434784,
              loss: 1.9882521629333496,
              val_accuracy: 0.4970000088214874,
              val_loss: 1.9363881349563599
            }
          }
        },
        running: false
      }
    },
    d1343a87c6ee4a2e82d19525964d2fb2cb6756c9: {
      data: {
        checkpoint_tip: '4fb124aebddb2adf1545030907687fa9a4c80e70',
        timestamp: '2020-12-29T15:31:51',
        params: {
          'params.yaml': {
            data: {
              epochs: 2,
              learning_rate: 2e-12,
              dvc_logs_dir: 'dvc_logs',
              log_file: 'logs.csv',
              dropout: 0.15,
              process: { threshold: 0.86, test_arg: 3 }
            }
          }
        },
        queued: false,
        running: false,
        executor: null,
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
        checkpoint_parent: '1ee5f2ecb0fa4d83cbf614386536344cf894dd53'
      }
    },
    c658f8b14ac819ac2a5ea0449da6c15dbe8eb880: {
      data: {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        executor: null,
        checkpoint_parent: '23250b33e3d6dd0e136262d1d26a2face031cb03',
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              dropout: 0.124,
              epochs: 5,
              learning_rate: 2.1e-7,
              log_file: 'logs.csv',
              process: { threshold: 0.85 }
            }
          }
        },
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.46094998717308044,
              loss: 1.9329891204833984,
              val_accuracy: 0.5550000071525574,
              val_loss: 1.8825950622558594
            }
          }
        },
        queued: false,
        running: false,
        timestamp: '2020-12-29T15:26:43'
      }
    },
    e821416bfafb4bc28b3e0a8ddb322505b0ad2361: {
      data: {
        checkpoint_tip: '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d',
        executor: null,
        checkpoint_parent: 'c658f8b14ac819ac2a5ea0449da6c15dbe8eb880',
        params: {
          'params.yaml': {
            data: {
              dvc_logs_dir: 'dvc_logs',
              dropout: 0.124,
              epochs: 5,
              learning_rate: 2.1e-7,
              log_file: 'logs.csv',
              process: { threshold: 0.85 }
            }
          }
        },
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.5113166570663452,
              loss: 1.8798457384109497,
              val_accuracy: 0.6035000085830688,
              val_loss: 1.827923059463501
            }
          }
        },
        queued: false,
        running: false,
        timestamp: '2020-12-29T15:26:49'
      }
    }
  },
  workspace: {
    baseline: {
      data: {
        executor: 'workspace',
        metrics: {
          'summary.json': {
            data: {
              accuracy: 0.4668000042438507,
              loss: 1.9293040037155151,
              val_accuracy: 0.5608000159263611,
              val_loss: 1.8770883083343506
            }
          }
        },
        params: {
          'params.yaml': {
            data: {
              dropout: 0.122,
              dvc_logs_dir: 'dvc_logs',
              epochs: 2,
              learning_rate: 2.2e-7,
              log_file: 'logs.csv',
              process: { test_arg: 'string', threshold: 0.86 }
            }
          }
        },
        queued: false,
        running: true,
        timestamp: null
      }
    }
  }
}

export default data
