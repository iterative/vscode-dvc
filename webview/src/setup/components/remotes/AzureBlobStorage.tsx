import React from 'react'
import styles from './styles.module.scss'
import { CloudVersioning } from './CloudVersioning'
import { ShowExtension } from './ShowExtension'

export const AzureBlobStorage = () => (
  <div className={styles.storageDetails}>
    <p>
      See the{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/azure-blob-storage#authentication">
        docs
      </a>{' '}
      for details on how to authenticate.
    </p>
    <ShowExtension
      capabilities="create storage accounts and manage blob containers"
      id="ms-azuretools.vscode-azurestorage"
      name="Azure Storage"
    />
    <CloudVersioning>
      <a href="https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview">
        Blob versioning
      </a>{' '}
      enabled on the storage account and container.
    </CloudVersioning>
  </div>
)
