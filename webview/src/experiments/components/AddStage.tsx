import React from 'react'
import styles from './table/styles.module.scss'
import { IconButton } from '../../shared/components/button/IconButton'
import { Add } from '../../shared/components/icons'
import { addConfiguration } from '../util/messages'

interface AddStageProps {
  hasValidDvcYaml: boolean
}

export const AddStage: React.FC<AddStageProps> = ({ hasValidDvcYaml }) => (
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
      onClick={() => hasValidDvcYaml && addConfiguration()}
      text="Add Stage"
      disabled={!hasValidDvcYaml}
    />
    {!hasValidDvcYaml && (
      <p className={styles.errorText}>
        A stage cannot be added to an invalid dvc.yaml file.
      </p>
    )}
    <p>
      Learn more about{' '}
      <a href="https://dvc.org/doc/user-guide/project-structure/dvcyaml-files">
        dvc.yaml
      </a>{' '}
      files.
    </p>
  </div>
)
