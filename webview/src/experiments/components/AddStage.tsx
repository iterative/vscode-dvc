import React from 'react'
import styles from './table/styles.module.scss'
import { IconButton } from '../../shared/components/button/IconButton'
import { Add } from '../../shared/components/icons'
import { addConfiguration } from '../util/messages'

export const AddStage: React.FC = () => (
  <div className={styles.addConfigButton}>
    <p>
      Define a{' '}
      <a href="https://dvc.org/doc/user-guide/pipelines/defining-pipelines">
        pipeline
      </a>{' '}
      to improve experiment reproducibility.
    </p>
    <IconButton
      icon={Add}
      onClick={() => addConfiguration()}
      text="Add Stage"
    />
    <p>
      Learn more about{' '}
      <a href="https://dvc.org/doc/user-guide/project-structure/dvcyaml-files">
        dvc.yaml
      </a>{' '}
      files.
    </p>
  </div>
)
