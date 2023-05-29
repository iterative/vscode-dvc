import React from 'react'
import {
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView
} from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { AmazonS3 } from './AmazonS3'
import { GoogleCloudStorage } from './GoogleCloudStorage'
import { AzureBlobStorage } from './AzureBlobStorage'
import { OtherStorageTypes } from './OtherStorageTypes'

const storageTypes = [
  {
    children: <AmazonS3 />,
    title: 'Amazon S3'
  },
  {
    children: <GoogleCloudStorage />,
    title: 'Google Cloud Storage'
  },
  {
    children: <AzureBlobStorage />,
    title: 'Azure Blob Storage'
  },
  {
    children: <OtherStorageTypes />,
    title: 'Other'
  }
]

export const StorageSlider: React.FC = () => (
  <div className={styles.storageSlider}>
    <VSCodePanels>
      {storageTypes.map(storageType => (
        <VSCodePanelTab key={`tab-${storageType.title}`}>
          {storageType.title}
        </VSCodePanelTab>
      ))}
      {storageTypes.map(storageType => (
        <VSCodePanelView
          key={`view-${storageType.title}`}
          className={styles.storageView}
        >
          {storageType.children}
        </VSCodePanelView>
      ))}
    </VSCodePanels>
  </div>
)
