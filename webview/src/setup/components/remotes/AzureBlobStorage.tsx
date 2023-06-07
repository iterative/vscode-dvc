import React from 'react'
import styles from './styles.module.scss'
import { ShowExtension } from './ShowExtension'

export const AzureBlobStorage = () => (
  <div className={styles.storageDetails}>
    <ShowExtension
      capabilities="create storage accounts and manage blob containers"
      id="ms-azuretools.vscode-azurestorage"
      name="Azure Storage"
    />
    <p>
      See the{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/azure-blob-storage#authentication">
        docs
      </a>{' '}
      for details on how to authenticate.
    </p>
  </div>
)
