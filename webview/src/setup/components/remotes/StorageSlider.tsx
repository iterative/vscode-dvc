import React, { PropsWithChildren } from 'react'
import {
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView
} from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import { Info, Warning } from '../../../shared/components/icons'
import { CodeBlock } from '../../../shared/components/codeBlock/CodeBlock'

const InfoIcon: React.FC = () => (
  <Icon icon={Info} width={16} height={16} className={styles.infoIcon} />
)

const WarnIcon: React.FC = () => (
  <Icon icon={Warning} width={16} height={16} className={styles.warnIcon} />
)

const CloudVersioning: React.FC<PropsWithChildren> = ({ children }) => (
  <>
    <p>
      <InfoIcon />{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/cloud-versioning">
        Cloud versioning
      </a>{' '}
      requires {children}
      {'\n'} To enable run:
    </p>
    <CodeBlock language="bash">
      dvc remote modify myremote version_aware true
    </CodeBlock>
  </>
)

const storageTypes = [
  {
    children: (
      <div className={styles.storageDetails}>
        <p>
          When needed, DVC will try to authenticate using your{' '}
          <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html">
            AWS CLI config
          </a>
          .{'\n'}This reads the default AWS credentials file (if available) or
          env vars.
        </p>
        <p>
          <InfoIcon /> The AWS user needs the following permissions:{'\n'}{' '}
          s3:ListBucket, s3:GetObject, s3:PutObject, s3:DeleteObject.
        </p>
        <CloudVersioning>
          <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html">
            S3 versioning
          </a>{' '}
          enabled on the bucket.
        </CloudVersioning>
        <p>
          For custom authentication see the{' '}
          <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/amazon-s3#custom-authentication">
            docs
          </a>
        </p>
      </div>
    ),
    title: 'Amazon S3'
  },
  {
    children: (
      <div className={styles.storageDetails}>
        <p>
          When needed, DVC will try to authenticate using your{' '}
          <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html">
            glcoud CLI authorization
          </a>
          .{'\n'}This reads the default GCP key file.
        </p>
        <p>
          <WarnIcon /> Make sure to run{' '}
          <a href="https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login">
            gcloud auth application-default login
          </a>{' '}
          unless{'\n'}
          you use a service account or other ways to authenticate (
          <a href="https://stackoverflow.com/a/53307505/298182">more info</a>).
        </p>
        <CloudVersioning>
          <a href="https://cloud.google.com/storage/docs/object-versioning">
            Object versioning
          </a>{' '}
          enabled on the bucket.
        </CloudVersioning>
        <p>
          For custom authentication see the{' '}
          <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/google-cloud-storage#custom-authentication">
            docs
          </a>
        </p>
      </div>
    ),
    title: 'Google Cloud Storage'
  },
  {
    children: (
      <div className={styles.storageDetails}>
        <p>
          See the{' '}
          <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/azure-blob-storage#authentication">
            docs
          </a>{' '}
          for details on how to authenticate.
        </p>
        <CloudVersioning>
          <a href="https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview">
            Blob versioning
          </a>{' '}
          enabled on the storage account and container.
        </CloudVersioning>
      </div>
    ),
    title: 'Azure Blob Storage'
  },
  {
    children: (
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
        <p>None of these remotes currently support cloud versioning.</p>
      </div>
    ),
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
