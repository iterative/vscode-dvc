import React from 'react'
import styles from './styles.module.scss'
import { AmazonS3 } from './AmazonS3'
import { GoogleCloudStorage } from './GoogleCloudStorage'
import { AzureBlobStorage } from './AzureBlobStorage'
import { OtherStorageTypes } from './OtherStorageTypes'
import { Panels } from '../shared/Panels'

export const SupportedStorage: React.FC = () => (
  <Panels
    panels={[
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
    ]}
    className={styles.supportedStorage}
  />
)
