import { timestampColumn } from '../../../../experiments/columns/constants'
import {
  buildDepPath,
  buildMetricOrParamPath
} from '../../../../experiments/columns/paths'
import { Column, ColumnType } from '../../../../experiments/webview/contract'
import { join } from '../../../util/path'

const data: Column[] = [
  timestampColumn,
  {
    hasChildren: true,
    label: join('results', 'metrics.json'),
    parentPath: ColumnType.METRICS,
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    type: ColumnType.METRICS
  },
  {
    hasChildren: false,
    label: 'fit_time',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'fit_time'
    ),
    pathArray: [
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'fit_time'
    ],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'score_time',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'score_time'
    ),
    pathArray: [
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'score_time'
    ],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'accuracy',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'accuracy'
    ),
    pathArray: [
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'accuracy'
    ],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'balanced_accuracy',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'balanced_accuracy'
    ),
    pathArray: [
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'balanced_accuracy'
    ],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'f1',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'f1'
    ),
    pathArray: [ColumnType.METRICS, join('results', 'metrics.json'), 'f1'],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'gmpr',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'gmpr'
    ),
    pathArray: [ColumnType.METRICS, join('results', 'metrics.json'), 'gmpr'],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'jaccard',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'jaccard'
    ),
    pathArray: [ColumnType.METRICS, join('results', 'metrics.json'), 'jaccard'],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'precision',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'precision'
    ),
    pathArray: [
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'precision'
    ],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'recall',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'recall'
    ),
    pathArray: [ColumnType.METRICS, join('results', 'metrics.json'), 'recall'],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'roc_auc',
    parentPath: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json')
    ),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      join('results', 'metrics.json'),
      'roc_auc'
    ),
    pathArray: [ColumnType.METRICS, join('results', 'metrics.json'), 'roc_auc'],
    type: ColumnType.METRICS,
    firstValueType: 'number'
  },
  {
    hasChildren: true,
    label: 'params.yaml',
    parentPath: ColumnType.PARAMS,
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'classifier',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'classifier'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'classifier'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'drop_cols',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'drop_cols'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'drop_cols'],
    type: ColumnType.PARAMS,
    firstValueType: 'array'
  },
  {
    hasChildren: true,
    label: 'dtypes',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'dtypes'),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'Age',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Age'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Age'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'Embarked',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Embarked'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Embarked'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'Fare',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Fare'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Fare'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'Parch',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Parch'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Parch'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'Pclass',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Pclass'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Pclass'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'Sex',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Sex'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Sex'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'SibSp',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'SibSp'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'SibSp'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'Survived',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dtypes',
      'Survived'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dtypes', 'Survived'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'feature_eng',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'feature_eng'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'featurize',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'feature_eng'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'feature_eng',
      'featurize'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'feature_eng', 'featurize'],
    type: ColumnType.PARAMS,
    firstValueType: 'boolean'
  },
  {
    hasChildren: true,
    label: 'imputation',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'Age',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation',
      'Age'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'imputation', 'Age'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'Fare',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation',
      'Fare'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'imputation', 'Fare'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'method',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'imputation',
      'method'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'imputation', 'method'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'model_params',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'logistic_regression',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'logistic_regression'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'logistic_regression'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'naive_bayes',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'naive_bayes'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'naive_bayes'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'neural_network',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'neural_network'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'neural_network'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: true,
    label: 'random_forest',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'criterion',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'criterion'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'criterion'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'max_depth',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'max_depth'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'max_depth'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'max_features',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'max_features'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'max_features'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'min_samples_leaf',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'min_samples_leaf'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'min_samples_leaf'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'min_samples_split',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'min_samples_split'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'min_samples_split'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'n_estimators',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'n_estimators'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'random_forest',
      'n_estimators'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'support_vector_machine',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'support_vector_machine'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'support_vector_machine'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'xgboost',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'model_params',
      'xgboost'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'model_params', 'xgboost'],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'normalize',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'normalize'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'normalize'],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: true,
    label: 'param_tuning',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'logistic_regression',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'logistic_regression'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'logistic_regression'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'naive_bayes',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'naive_bayes'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'naive_bayes'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'neural_network',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'neural_network'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'neural_network'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: false,
    label: 'num_eval',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'num_eval'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'param_tuning', 'num_eval'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: true,
    label: 'random_forest',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'criterion',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'criterion'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'criterion'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'max_depth',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'max_depth'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'max_depth'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'max_features',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'max_features'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'max_features'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'min_samples_leaf',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'min_samples_leaf'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'min_samples_leaf'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'min_samples_split',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'min_samples_split'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'min_samples_split'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'n_estimators',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'n_estimators'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'random_forest',
      'n_estimators'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'scoring',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'scoring'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'param_tuning', 'scoring'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'support_vector_machine',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'support_vector_machine'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'param_tuning',
      'support_vector_machine'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'null'
  },
  {
    hasChildren: true,
    label: 'predict',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'predict'),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'js_estimator',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'predict'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'predict',
      'js_estimator'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'predict', 'js_estimator'],
    type: ColumnType.PARAMS,
    firstValueType: 'boolean'
  },
  {
    hasChildren: false,
    label: 'random_seed',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'random_seed'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'random_seed'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: true,
    label: 'train_test_split',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split'
    ),
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'n_split',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split',
      'n_split'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split',
      'n_split'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'shuffle',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split',
      'shuffle'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split',
      'shuffle'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'boolean'
  },
  {
    hasChildren: false,
    label: 'target_class',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split',
      'target_class'
    ),
    pathArray: [
      ColumnType.PARAMS,
      'params.yaml',
      'train_test_split',
      'target_class'
    ],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'src',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('src'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: true,
    label: 'data',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'data'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'make_dataset.py',
    parentPath: buildDepPath('src', 'data'),
    path: buildDepPath('src', 'data', 'make_dataset.py'),
    pathArray: [ColumnType.DEPS, join('src', 'data', 'make_dataset.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'data',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('data'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: true,
    label: 'raw',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'raw'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'test.csv',
    parentPath: buildDepPath('data', 'raw'),
    path: buildDepPath('data', 'raw', 'test.csv'),
    pathArray: [ColumnType.DEPS, join('data', 'raw', 'test.csv')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'train.csv',
    parentPath: buildDepPath('data', 'raw'),
    path: buildDepPath('data', 'raw', 'train.csv'),
    pathArray: [ColumnType.DEPS, join('data', 'raw', 'train.csv')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'encode_labels.py',
    parentPath: buildDepPath('src', 'data'),
    path: buildDepPath('src', 'data', 'encode_labels.py'),
    pathArray: [ColumnType.DEPS, join('src', 'data', 'encode_labels.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'interim',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'interim'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'test_categorized.csv',
    parentPath: buildDepPath('data', 'interim'),
    path: buildDepPath('data', 'interim', 'test_categorized.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'interim', 'test_categorized.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'train_categorized.csv',
    parentPath: buildDepPath('data', 'interim'),
    path: buildDepPath('data', 'interim', 'train_categorized.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'interim', 'train_categorized.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'replace_nan.py',
    parentPath: buildDepPath('src', 'data'),
    path: buildDepPath('src', 'data', 'replace_nan.py'),
    pathArray: [ColumnType.DEPS, join('src', 'data', 'replace_nan.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'test_nan_imputed.csv',
    parentPath: buildDepPath('data', 'interim'),
    path: buildDepPath('data', 'interim', 'test_nan_imputed.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'interim', 'test_nan_imputed.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'train_nan_imputed.csv',
    parentPath: buildDepPath('data', 'interim'),
    path: buildDepPath('data', 'interim', 'train_nan_imputed.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'interim', 'train_nan_imputed.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'features',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'features'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'build_features.py',
    parentPath: buildDepPath('src', 'features'),
    path: buildDepPath('src', 'features', 'build_features.py'),
    pathArray: [ColumnType.DEPS, join('src', 'features', 'build_features.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'test_featurized.csv',
    parentPath: buildDepPath('data', 'interim'),
    path: buildDepPath('data', 'interim', 'test_featurized.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'interim', 'test_featurized.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'train_featurized.csv',
    parentPath: buildDepPath('data', 'interim'),
    path: buildDepPath('data', 'interim', 'train_featurized.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'interim', 'train_featurized.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'normalize.py',
    parentPath: buildDepPath('src', 'features'),
    path: buildDepPath('src', 'features', 'normalize.py'),
    pathArray: [ColumnType.DEPS, join('src', 'features', 'normalize.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'processed',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'processed'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'train_processed.csv',
    parentPath: buildDepPath('data', 'processed'),
    path: buildDepPath('data', 'processed', 'train_processed.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'processed', 'train_processed.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'split_train_dev.py',
    parentPath: buildDepPath('src', 'data'),
    path: buildDepPath('src', 'data', 'split_train_dev.py'),
    pathArray: [ColumnType.DEPS, join('src', 'data', 'split_train_dev.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'split_train_dev.csv',
    parentPath: buildDepPath('data', 'processed'),
    path: buildDepPath('data', 'processed', 'split_train_dev.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'processed', 'split_train_dev.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'models',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'models'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'train_model.py',
    parentPath: buildDepPath('src', 'models'),
    path: buildDepPath('src', 'models', 'train_model.py'),
    pathArray: [ColumnType.DEPS, join('src', 'models', 'train_model.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'test_processed.csv',
    parentPath: buildDepPath('data', 'processed'),
    path: buildDepPath('data', 'processed', 'test_processed.csv'),
    pathArray: [
      ColumnType.DEPS,
      join('data', 'processed', 'test_processed.csv')
    ],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: true,
    label: 'models',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('models'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    label: 'estimator.pkl',
    parentPath: buildDepPath('models'),
    path: buildDepPath('models', 'estimator.pkl'),
    pathArray: [ColumnType.DEPS, join('models', 'estimator.pkl')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'metrics.py',
    parentPath: buildDepPath('src', 'models'),
    path: buildDepPath('src', 'models', 'metrics.py'),
    pathArray: [ColumnType.DEPS, join('src', 'models', 'metrics.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'predict.py',
    parentPath: buildDepPath('src', 'models'),
    path: buildDepPath('src', 'models', 'predict.py'),
    pathArray: [ColumnType.DEPS, join('src', 'models', 'predict.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  }
]

export default data
