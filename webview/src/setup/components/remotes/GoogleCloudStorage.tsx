import React from 'react'
import styles from './styles.module.scss'
import { ShowExtension } from './ShowExtension'
import { Icon } from '../../../shared/components/Icon'
import { Warning } from '../../../shared/components/icons'

export const GoogleCloudStorage: React.FC = () => (
  <div className={styles.storageDetails}>
    <ShowExtension
      id="GoogleCloudTools.cloudcode"
      name="Google Cloud Code"
      capabilities="create projects and provides snippets for working with the Cloud Storage API"
    />
    <p>
      When needed, DVC will try to authenticate using your{' '}
      <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html">
        glcoud CLI authorization
      </a>
      . This reads the default GCP key file. For custom authentication see the{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/google-cloud-storage#custom-authentication">
        docs
      </a>
      .
    </p>
    <p>
      <Icon icon={Warning} width={16} height={16} className={styles.warnIcon} />{' '}
      Make sure to run{' '}
      <a href="https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login">
        gcloud auth application-default login
      </a>{' '}
      unless you use a service account or other ways to authenticate (
      <a href="https://stackoverflow.com/a/53307505/298182">more info</a>).
    </p>
  </div>
)
