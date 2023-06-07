import React from 'react'
import styles from './styles.module.scss'
import { InfoText } from './InfoText'
import { ShowExtension } from './ShowExtension'

export const AmazonS3 = () => (
  <div className={styles.storageDetails}>
    <ShowExtension
      id="AmazonWebServices.aws-toolkit-vscode"
      name="AWS Toolkit"
      capabilities="manage AWS profiles and S3 buckets"
    />
    <p>
      When needed, DVC will try to authenticate using your{' '}
      <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html">
        AWS CLI config
      </a>
      . This reads the default AWS credentials file (if available) or env vars.
      For custom authentication see the{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/remote-storage/amazon-s3#custom-authentication">
        docs
      </a>
      .
    </p>
    <InfoText>
      The AWS user needs the following permissions: s3:ListBucket, s3:GetObject,
      s3:PutObject, s3:DeleteObject.
    </InfoText>
  </div>
)
