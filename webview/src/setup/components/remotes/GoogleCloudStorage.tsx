import React from 'react'
import styles from './styles.module.scss'
import { CloudVersioning } from './CloudVersioning'
import { CustomAuth } from './CustomAuth'
import { Icon } from '../../../shared/components/Icon'
import { Warning } from '../../../shared/components/icons'

export const GoogleCloudStorage: React.FC = () => (
  <div className={styles.storageDetails}>
    <p>
      When needed, DVC will try to authenticate using your{' '}
      <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html">
        glcoud CLI authorization
      </a>
      .{'\n'}This reads the default GCP key file.
    </p>
    <p>
      <Icon icon={Warning} width={16} height={16} className={styles.warnIcon} />{' '}
      Make sure to run{' '}
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
      enabled on the bucket.{'\n'}
    </CloudVersioning>
    <CustomAuth href="https://dvc.org/doc/user-guide/data-management/remote-storage/google-cloud-storage#custom-authentication" />
  </div>
)
