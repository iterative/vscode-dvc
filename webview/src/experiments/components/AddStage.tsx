import React from 'react'
import styles from './table/styles.module.scss'
import { IconButton } from '../../shared/components/button/IconButton'
import { Add } from '../../shared/components/icons'
import { addConfiguration } from '../util/messages'

export const AddStage: React.FC = () => (
  <div className={styles.addConfigButton}>
    <p>
      Create a{' '}
      <a href="https://dvc.org/doc/user-guide/project-structure/dvcyaml-files">
        dvc.yaml
      </a>{' '}
      to run, queue and pass parameters to new experiments.
    </p>
    <IconButton
      icon={Add}
      onClick={() => addConfiguration()}
      text="Add dvc.yaml"
    />
    <p>
      Learn more about{' '}
      <a href="https://dvc.org/doc/user-guide/pipelines/defining-pipelines">
        pipelines
      </a>{' '}
      .
    </p>
  </div>
)
