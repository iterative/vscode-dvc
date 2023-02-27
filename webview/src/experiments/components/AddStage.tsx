import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import styles from './table/styles.module.scss'
import { IconButton } from '../../shared/components/button/IconButton'
import { Add } from '../../shared/components/icons'
import { sendMessage } from '../../shared/vscode'

interface AddStageProps {
  hasValidDvcYaml: boolean
}

export const AddStage: React.FC<AddStageProps> = ({ hasValidDvcYaml }) => (
  <div className={styles.addConfigButton}>
    <p>Easily and efficiently reproduce your experiments </p>
    <IconButton
      icon={Add}
      onClick={() =>
        sendMessage({ type: MessageFromWebviewType.ADD_CONFIGURATION })
      }
      text="Add a Pipeline Stage"
      disabled={!hasValidDvcYaml}
    />
    {!hasValidDvcYaml && (
      <p className={styles.error}>
        Your dvc.yaml file should contain valid yaml before adding any pipeline
        stages.
      </p>
    )}
    <p>
      <a href="https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#stages">
        Learn more
      </a>
    </p>
  </div>
)
