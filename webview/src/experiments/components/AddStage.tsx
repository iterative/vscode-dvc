import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import styles from './table/styles.module.scss'
import { IconButton } from '../../shared/components/button/IconButton'
import { Add } from '../../shared/components/icons'
import { sendMessage } from '../../shared/vscode'

export const AddStage: React.FC = () => (
  <div className={styles.addConfigButton}>
    <p>Want to easily and efficiently reproduce your experiments? </p>
    <IconButton
      icon={Add}
      onClick={() =>
        sendMessage({ type: MessageFromWebviewType.ADD_CONFIGURATION })
      }
      text="Add a pipeline stage"
    />
    <p>
      <a href="https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#stages">
        Learn more
      </a>
    </p>
  </div>
)
