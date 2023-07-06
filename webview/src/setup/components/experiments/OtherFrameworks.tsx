import React from 'react'
import styles from './styles.module.scss'

export const OtherFrameworks = () => (
  <div className={styles.otherFrameworks}>
    These frameworks are also supported:
    <ul>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/catalyst">
          Catalyst
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/fastai">Fast.ai</a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/lightgbm">
          LightGBM
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/mmcv">MMCV</a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/optuna">Optuna</a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/pytorch">PyTorch</a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/tensorflow">
          TensorFlow
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/dvclive/ml-frameworks/xgboost">XGBoost</a>
      </li>
    </ul>
  </div>
)
