import React from 'react'
import styles from './styles.module.scss'
import { InfoText } from './InfoText'
import { CloudVersioningLink } from './CloudVersioningLink'

export const OtherStorageTypes: React.FC = () => (
  <div className={styles.storageDetails}>
    These storage options are also supported:
    <ul>
      <li>
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/google-drive">
          Google Drive
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/aliyun-oss">
          Aliyun OSS
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/ssh">
          SSH & SFTP
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/hdfs">
          HDFS & WebHDFS
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/http">
          HTTP
        </a>
      </li>
      <li>
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/webdav">
          WebDAV
        </a>
      </li>
    </ul>
    <InfoText>
      <CloudVersioningLink /> is not currently supported by any of these
      remotes.
    </InfoText>
  </div>
)
