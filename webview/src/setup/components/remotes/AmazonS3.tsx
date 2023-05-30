import React from 'react'
import styles from './styles.module.scss'
import { InfoText } from './InfoText'
import { CloudVersioning } from './CloudVersioning'
import { CustomAuth } from './CustomAuth'

export const AmazonS3 = () => (
  <div className={styles.storageDetails}>
    <p>
      When needed, DVC will try to authenticate using your{' '}
      <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html">
        AWS CLI config
      </a>
      . This reads the default AWS credentials file (if available) or env vars.
    </p>

    <InfoText>
      The AWS user needs the following permissions: s3:ListBucket, s3:GetObject,
      s3:PutObject, s3:DeleteObject.
    </InfoText>
    <CloudVersioning>
      <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html">
        S3 versioning
      </a>{' '}
      enabled on the bucket.
    </CloudVersioning>
    <CustomAuth href="https://dvc.org/doc/user-guide/data-management/remote-storage/amazon-s3#custom-authentication" />
  </div>
)
