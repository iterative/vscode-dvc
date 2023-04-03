import { join } from '../../../util/path'
import {
  ExperimentStatus,
  Commit
} from '../../../../experiments/webview/contract'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'

const data: Commit[] = [
  {
    id: EXPERIMENT_WORKSPACE_ID,
    label: EXPERIMENT_WORKSPACE_ID,
    outs: {
      [join('data', 'raw', 'test.csv')]: {
        hash: '029c9cd22461f6dbe8d9ab01def965c6',
        size: 28629,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'raw', 'train.csv')]: {
        hash: '61fdd54abdbf6a85b778e937122e1194',
        size: 61194,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'data_dictionary.tex')]: {
        hash: '10c5361db59b330722bd70b83ce0fcee',
        size: 1521,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'table_one.tex')]: {
        hash: '4581508bdb37e12d9b9b5ff03244390d',
        size: 844,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        hash: 'f0fcdcd7bb08c23d382a665ac1436034',
        size: 10788,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        hash: '5d06666c95fed743140b44190fb67c77',
        size: 23884,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        hash: 'cbc38434c407b0761da80a422ba97cff',
        size: 11136,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        hash: '9edd0421f46d2f0786ea6d82fdcf4e12',
        size: 24592,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        hash: '6879b369c8d9f93c8ddeff61baea9ada',
        size: 59474,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        hash: '980d370c7991c5b991bf8c47d13beb02',
        size: 127169,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        hash: '0cb34fc53024fa12b32a098a32870612',
        size: 59004,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        hash: '55fc818f9babfe04c7bd9a605e0f6240',
        size: 126326,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        hash: 'd4d2c3159380a986fc2f04a8bcffda08',
        size: 56115,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('models', 'estimator.pkl')]: {
        hash: 'a97b560743390021fc662ba0496e6237',
        size: 31660351,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_binary.csv')]: {
        hash: '76577b506c3bc22a50d1aa61f3b940d0',
        size: 2839,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_proba.csv')]: {
        hash: '84ac915213a1b4f510486a0d049f39df',
        size: 10087,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      }
    },
    status: ExperimentStatus.SUCCESS,
    executor: null,
    metrics: {
      [join('results', 'metrics.json')]: {
        fit_time: 0.6337410688400269,
        score_time: 0.07778854370117187,
        accuracy: 0.8293632958801498,
        balanced_accuracy: 0.8040020654726536,
        f1: 0.7572265847252886,
        gmpr: 0.7615174102573903,
        jaccard: 0.6113136909663465,
        precision: 0.8361572183378356,
        recall: 0.695546218487395,
        roc_auc: 0.8703211951447246
      }
    },
    params: {
      'params.yaml': {
        classifier: 'random_forest',
        drop_cols: ['Name', 'Cabin', 'Ticket'],
        dtypes: {
          Age: 'float',
          Embarked: 'category',
          Fare: 'float',
          Parch: 'int',
          Pclass: 'category',
          Sex: 'category',
          SibSp: 'int',
          Survived: 'category'
        },
        feature_eng: { featurize: true },
        imputation: { Age: 29.6991, Fare: 32.2042, method: 'mean' },
        model_params: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          support_vector_machine: null,
          xgboost: null
        },
        normalize: null,
        param_tuning: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          num_eval: 100,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          scoring: 'accuracy',
          support_vector_machine: null
        },
        predict: { js_estimator: true },
        random_seed: 12345,
        train_test_split: {
          n_split: 10,
          shuffle: true,
          target_class: 'Survived'
        }
      }
    },
    deps: {
      [join('src', 'data', 'make_dataset.py')]: {
        changes: false,
        value: '4f66b01'
      },
      [join('data', 'raw', 'test.csv')]: { changes: false, value: '029c9cd' },
      [join('data', 'raw', 'train.csv')]: { changes: false, value: '61fdd54' },
      [join('src', 'data', 'encode_labels.py')]: {
        changes: false,
        value: '71c20e2'
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        changes: false,
        value: 'f0fcdcd'
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        changes: false,
        value: '5d06666'
      },
      [join('src', 'data', 'replace_nan.py')]: {
        changes: false,
        value: 'a292443'
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        changes: false,
        value: 'cbc3843'
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        changes: false,
        value: '9edd042'
      },
      [join('src', 'features', 'build_features.py')]: {
        changes: false,
        value: '15a0db1'
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        changes: false,
        value: '6879b36'
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        changes: false,
        value: '980d370'
      },
      [join('src', 'features', 'normalize.py')]: {
        changes: false,
        value: '06e7d4f'
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        changes: false,
        value: '55fc818'
      },
      [join('src', 'data', 'split_train_dev.py')]: {
        changes: false,
        value: '3ccd2f1'
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        changes: false,
        value: 'd4d2c31'
      },
      [join('src', 'models', 'train_model.py')]: {
        changes: false,
        value: '3edee7d'
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        changes: false,
        value: '0cb34fc'
      },
      [join('models', 'estimator.pkl')]: { changes: false, value: 'a97b560' },
      [join('src', 'models', 'metrics.py')]: {
        changes: false,
        value: '71807a3'
      },
      [join('src', 'models', 'predict.py')]: {
        changes: false,
        value: 'ffcea00'
      }
    },
    displayColor: undefined,
    selected: false,
    starred: false
  },
  {
    id: 'master',
    label: 'master',
    outs: {
      [join('data', 'raw', 'test.csv')]: {
        hash: '029c9cd22461f6dbe8d9ab01def965c6',
        size: 28629,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'raw', 'train.csv')]: {
        hash: '61fdd54abdbf6a85b778e937122e1194',
        size: 61194,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'data_dictionary.tex')]: {
        hash: '10c5361db59b330722bd70b83ce0fcee',
        size: 1521,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'table_one.tex')]: {
        hash: '4581508bdb37e12d9b9b5ff03244390d',
        size: 844,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        hash: 'f0fcdcd7bb08c23d382a665ac1436034',
        size: 10788,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        hash: '5d06666c95fed743140b44190fb67c77',
        size: 23884,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        hash: 'cbc38434c407b0761da80a422ba97cff',
        size: 11136,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        hash: '9edd0421f46d2f0786ea6d82fdcf4e12',
        size: 24592,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        hash: '6879b369c8d9f93c8ddeff61baea9ada',
        size: 59474,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        hash: '980d370c7991c5b991bf8c47d13beb02',
        size: 127169,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        hash: '0cb34fc53024fa12b32a098a32870612',
        size: 59004,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        hash: '55fc818f9babfe04c7bd9a605e0f6240',
        size: 126326,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        hash: 'd4d2c3159380a986fc2f04a8bcffda08',
        size: 56115,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('models', 'estimator.pkl')]: {
        hash: 'a97b560743390021fc662ba0496e6237',
        size: 31660351,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_binary.csv')]: {
        hash: '76577b506c3bc22a50d1aa61f3b940d0',
        size: 2839,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_proba.csv')]: {
        hash: '84ac915213a1b4f510486a0d049f39df',
        size: 10087,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      }
    },
    status: ExperimentStatus.SUCCESS,
    executor: null,
    name: 'master',
    sha: '3d5adcb974bb2c85917a5d61a489b933adaa2b7f',
    Created: '2021-07-16T19:54:42',
    metrics: {
      [join('results', 'metrics.json')]: {
        fit_time: 0.6337410688400269,
        score_time: 0.07778854370117187,
        accuracy: 0.8293632958801498,
        balanced_accuracy: 0.8040020654726536,
        f1: 0.7572265847252886,
        gmpr: 0.7615174102573903,
        jaccard: 0.6113136909663465,
        precision: 0.8361572183378356,
        recall: 0.695546218487395,
        roc_auc: 0.8703211951447246
      }
    },
    params: {
      'params.yaml': {
        classifier: 'random_forest',
        drop_cols: ['Name', 'Cabin', 'Ticket'],
        dtypes: {
          Age: 'float',
          Embarked: 'category',
          Fare: 'float',
          Parch: 'int',
          Pclass: 'category',
          Sex: 'category',
          SibSp: 'int',
          Survived: 'category'
        },
        feature_eng: { featurize: true },
        imputation: { Age: 29.6991, Fare: 32.2042, method: 'mean' },
        model_params: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          support_vector_machine: null,
          xgboost: null
        },
        normalize: null,
        param_tuning: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          num_eval: 100,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          scoring: 'accuracy',
          support_vector_machine: null
        },
        predict: { js_estimator: true },
        random_seed: 12345,
        train_test_split: {
          n_split: 10,
          shuffle: true,
          target_class: 'Survived'
        }
      }
    },
    deps: {
      [join('src', 'data', 'make_dataset.py')]: {
        changes: false,
        value: '4f66b01'
      },
      [join('data', 'raw', 'test.csv')]: { changes: false, value: '029c9cd' },
      [join('data', 'raw', 'train.csv')]: { changes: false, value: '61fdd54' },
      [join('src', 'data', 'encode_labels.py')]: {
        changes: false,
        value: '71c20e2'
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        changes: false,
        value: 'f0fcdcd'
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        changes: false,
        value: '5d06666'
      },
      [join('src', 'data', 'replace_nan.py')]: {
        changes: false,
        value: 'a292443'
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        changes: false,
        value: 'cbc3843'
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        changes: false,
        value: '9edd042'
      },
      [join('src', 'features', 'build_features.py')]: {
        changes: false,
        value: '15a0db1'
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        changes: false,
        value: '6879b36'
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        changes: false,
        value: '980d370'
      },
      [join('src', 'features', 'normalize.py')]: {
        changes: false,
        value: '06e7d4f'
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        changes: false,
        value: '55fc818'
      },
      [join('src', 'data', 'split_train_dev.py')]: {
        changes: false,
        value: '3ccd2f1'
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        changes: false,
        value: 'd4d2c31'
      },
      [join('src', 'models', 'train_model.py')]: {
        changes: false,
        value: '3edee7d'
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        changes: false,
        value: '0cb34fc'
      },
      [join('models', 'estimator.pkl')]: { changes: false, value: 'a97b560' },
      [join('src', 'models', 'metrics.py')]: {
        changes: false,
        value: '71807a3'
      },
      [join('src', 'models', 'predict.py')]: {
        changes: false,
        value: 'ffcea00'
      }
    },
    displayColor: undefined,
    selected: false,
    starred: false
  },
  {
    id: 'a49e03966a1f9f1299ec222ebc4bed8625d2c54d',
    label: 'a49e039',
    outs: {
      [join('data', 'raw', 'test.csv')]: {
        hash: '029c9cd22461f6dbe8d9ab01def965c6',
        size: 28629,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'raw', 'train.csv')]: {
        hash: '61fdd54abdbf6a85b778e937122e1194',
        size: 61194,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'data_dictionary.tex')]: {
        hash: '10c5361db59b330722bd70b83ce0fcee',
        size: 1521,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'table_one.tex')]: {
        hash: '4581508bdb37e12d9b9b5ff03244390d',
        size: 844,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        hash: 'f0fcdcd7bb08c23d382a665ac1436034',
        size: 10788,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        hash: '5d06666c95fed743140b44190fb67c77',
        size: 23884,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        hash: 'cbc38434c407b0761da80a422ba97cff',
        size: 11136,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        hash: '9edd0421f46d2f0786ea6d82fdcf4e12',
        size: 24592,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        hash: '6879b369c8d9f93c8ddeff61baea9ada',
        size: 59474,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        hash: '980d370c7991c5b991bf8c47d13beb02',
        size: 127169,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        hash: '0cb34fc53024fa12b32a098a32870612',
        size: 59004,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        hash: '55fc818f9babfe04c7bd9a605e0f6240',
        size: 126326,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        hash: 'd4d2c3159380a986fc2f04a8bcffda08',
        size: 56115,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('models', 'estimator.pkl')]: {
        hash: 'a97b560743390021fc662ba0496e6237',
        size: 31660351,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_binary.csv')]: {
        hash: '76577b506c3bc22a50d1aa61f3b940d0',
        size: 2839,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_proba.csv')]: {
        hash: '84ac915213a1b4f510486a0d049f39df',
        size: 10087,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      }
    },
    status: ExperimentStatus.SUCCESS,
    executor: null,
    sha: 'a49e03966a1f9f1299ec222ebc4bed8625d2c54d',
    Created: '2021-07-16T19:50:39',
    metrics: {
      [join('results', 'metrics.json')]: {
        fit_time: 0.6337410688400269,
        score_time: 0.07778854370117187,
        accuracy: 0.8293632958801498,
        balanced_accuracy: 0.8040020654726536,
        f1: 0.7572265847252886,
        gmpr: 0.7615174102573903,
        jaccard: 0.6113136909663465,
        precision: 0.8361572183378356,
        recall: 0.695546218487395,
        roc_auc: 0.8703211951447246
      }
    },
    params: {
      'params.yaml': {
        classifier: 'random_forest',
        drop_cols: ['Name', 'Cabin', 'Ticket'],
        dtypes: {
          Age: 'float',
          Embarked: 'category',
          Fare: 'float',
          Parch: 'int',
          Pclass: 'category',
          Sex: 'category',
          SibSp: 'int',
          Survived: 'category'
        },
        feature_eng: { featurize: true },
        imputation: { Age: 29.6991, Fare: 32.2042, method: 'mean' },
        model_params: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          support_vector_machine: null,
          xgboost: null
        },
        normalize: null,
        param_tuning: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          num_eval: 100,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          scoring: 'accuracy',
          support_vector_machine: null
        },
        predict: { js_estimator: true },
        random_seed: 12345,
        train_test_split: {
          n_split: 10,
          shuffle: true,
          target_class: 'Survived'
        }
      }
    },
    deps: {
      [join('src', 'data', 'make_dataset.py')]: {
        changes: false,
        value: '4f66b01'
      },
      [join('data', 'raw', 'test.csv')]: { changes: false, value: '029c9cd' },
      [join('data', 'raw', 'train.csv')]: { changes: false, value: '61fdd54' },
      [join('src', 'data', 'encode_labels.py')]: {
        changes: false,
        value: '71c20e2'
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        changes: false,
        value: 'f0fcdcd'
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        changes: false,
        value: '5d06666'
      },
      [join('src', 'data', 'replace_nan.py')]: {
        changes: false,
        value: 'e1a2e28'
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        changes: false,
        value: 'cbc3843'
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        changes: false,
        value: '9edd042'
      },
      [join('src', 'features', 'build_features.py')]: {
        changes: false,
        value: '15a0db1'
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        changes: false,
        value: '6879b36'
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        changes: false,
        value: '980d370'
      },
      [join('src', 'features', 'normalize.py')]: {
        changes: false,
        value: '06e7d4f'
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        changes: false,
        value: '55fc818'
      },
      [join('src', 'data', 'split_train_dev.py')]: {
        changes: false,
        value: '3ccd2f1'
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        changes: false,
        value: 'd4d2c31'
      },
      [join('src', 'models', 'train_model.py')]: {
        changes: false,
        value: '3edee7d'
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        changes: false,
        value: '0cb34fc'
      },
      [join('models', 'estimator.pkl')]: { changes: false, value: 'a97b560' },
      [join('src', 'models', 'metrics.py')]: {
        changes: false,
        value: '71807a3'
      },
      [join('src', 'models', 'predict.py')]: {
        changes: false,
        value: 'ffcea00'
      }
    },
    displayColor: undefined,
    selected: false,
    starred: false
  },
  {
    id: '4f7b50c3d171a11b6cfcd04416a16fc80b61018d',
    label: '4f7b50c',
    outs: {
      [join('data', 'raw', 'test.csv')]: {
        hash: '029c9cd22461f6dbe8d9ab01def965c6',
        size: 28629,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'raw', 'train.csv')]: {
        hash: '61fdd54abdbf6a85b778e937122e1194',
        size: 61194,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'data_dictionary.tex')]: {
        hash: '10c5361db59b330722bd70b83ce0fcee',
        size: 1521,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('reports', 'figures', 'table_one.tex')]: {
        hash: '4581508bdb37e12d9b9b5ff03244390d',
        size: 844,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        hash: 'f0fcdcd7bb08c23d382a665ac1436034',
        size: 10788,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        hash: '5d06666c95fed743140b44190fb67c77',
        size: 23884,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        hash: 'cbc38434c407b0761da80a422ba97cff',
        size: 11136,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        hash: '9edd0421f46d2f0786ea6d82fdcf4e12',
        size: 24592,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        hash: '6879b369c8d9f93c8ddeff61baea9ada',
        size: 59474,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        hash: '980d370c7991c5b991bf8c47d13beb02',
        size: 127169,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        hash: '0cb34fc53024fa12b32a098a32870612',
        size: 59004,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        hash: '55fc818f9babfe04c7bd9a605e0f6240',
        size: 126326,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        hash: 'd4d2c3159380a986fc2f04a8bcffda08',
        size: 56115,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('models', 'estimator.pkl')]: {
        hash: 'a97b560743390021fc662ba0496e6237',
        size: 31660351,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_binary.csv')]: {
        hash: '76577b506c3bc22a50d1aa61f3b940d0',
        size: 2839,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      },
      [join('results', 'test_predict_proba.csv')]: {
        hash: '84ac915213a1b4f510486a0d049f39df',
        size: 10087,
        nfiles: null,
        use_cache: true,
        is_data_source: false
      }
    },
    status: ExperimentStatus.SUCCESS,
    executor: null,
    sha: '4f7b50c3d171a11b6cfcd04416a16fc80b61018d',
    Created: '2021-07-16T19:48:45',
    metrics: {
      [join('results', 'metrics.json')]: {
        fit_time: 0.6337410688400269,
        score_time: 0.07778854370117187,
        accuracy: 0.8293632958801498,
        balanced_accuracy: 0.8040020654726536,
        f1: 0.7572265847252886,
        gmpr: 0.7615174102573903,
        jaccard: 0.6113136909663465,
        precision: 0.8361572183378356,
        recall: 0.695546218487395,
        roc_auc: 0.8703211951447246
      }
    },
    params: {
      'params.yaml': {
        classifier: 'random_forest',
        drop_cols: ['Name', 'Cabin', 'Ticket'],
        dtypes: {
          Age: 'float',
          Embarked: 'category',
          Fare: 'float',
          Parch: 'int',
          Pclass: 'category',
          Sex: 'category',
          SibSp: 'int',
          Survived: 'category'
        },
        feature_eng: { featurize: true },
        imputation: { Age: 29.6991, Fare: 32.2042, method: 'mean' },
        model_params: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          support_vector_machine: null,
          xgboost: null
        },
        normalize: null,
        param_tuning: {
          logistic_regression: null,
          naive_bayes: null,
          neural_network: null,
          num_eval: 100,
          random_forest: {
            criterion: 'gini',
            max_depth: 15,
            max_features: 'auto',
            min_samples_leaf: 6,
            min_samples_split: 9,
            n_estimators: 460
          },
          scoring: 'accuracy',
          support_vector_machine: null
        },
        predict: { js_estimator: true },
        random_seed: 12345,
        train_test_split: {
          n_split: 10,
          shuffle: true,
          target_class: 'Survived'
        }
      }
    },
    deps: {
      [join('src', 'data', 'make_dataset.py')]: {
        changes: false,
        value: '4f66b01'
      },
      [join('data', 'raw', 'test.csv')]: { changes: false, value: '029c9cd' },
      [join('data', 'raw', 'train.csv')]: { changes: false, value: '61fdd54' },
      [join('src', 'data', 'encode_labels.py')]: {
        changes: false,
        value: '71c20e2'
      },
      [join('data', 'interim', 'test_categorized.csv')]: {
        changes: false,
        value: 'f0fcdcd'
      },
      [join('data', 'interim', 'train_categorized.csv')]: {
        changes: false,
        value: '5d06666'
      },
      [join('src', 'data', 'replace_nan.py')]: {
        changes: false,
        value: 'e1a2e28'
      },
      [join('data', 'interim', 'test_nan_imputed.csv')]: {
        changes: false,
        value: 'cbc3843'
      },
      [join('data', 'interim', 'train_nan_imputed.csv')]: {
        changes: false,
        value: '9edd042'
      },
      [join('src', 'features', 'build_features.py')]: {
        changes: false,
        value: '15a0db1'
      },
      [join('data', 'interim', 'test_featurized.csv')]: {
        changes: false,
        value: '6879b36'
      },
      [join('data', 'interim', 'train_featurized.csv')]: {
        changes: false,
        value: '980d370'
      },
      [join('src', 'features', 'normalize.py')]: {
        changes: false,
        value: '06e7d4f'
      },
      [join('data', 'processed', 'train_processed.csv')]: {
        changes: false,
        value: '55fc818'
      },
      [join('src', 'data', 'split_train_dev.py')]: {
        changes: false,
        value: '3ccd2f1'
      },
      [join('data', 'processed', 'split_train_dev.csv')]: {
        changes: false,
        value: 'd4d2c31'
      },
      [join('src', 'models', 'train_model.py')]: {
        changes: false,
        value: '3edee7d'
      },
      [join('data', 'processed', 'test_processed.csv')]: {
        changes: false,
        value: '0cb34fc'
      },
      [join('models', 'estimator.pkl')]: { changes: false, value: 'a97b560' },
      [join('src', 'models', 'metrics.py')]: {
        changes: false,
        value: '71807a3'
      },
      [join('src', 'models', 'predict.py')]: {
        changes: false,
        value: 'ffcea00'
      }
    },
    displayColor: undefined,
    selected: false,
    starred: false
  }
]

export default data
