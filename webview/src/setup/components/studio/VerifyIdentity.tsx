import React from 'react'
import styles from './styles.module.scss'
import { openStudioAuthLink } from '../../util/messages'
import { Button } from '../../../shared/components/button/Button'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'

export const VerifyIdentity: React.FC<{ studioVerifyUserCode: string }> = ({
  studioVerifyUserCode
}) => {
  return (
    <>
      <p>
        We sent a token request to Studio. Enter the code shown below to verify
        your identity.
      </p>
      <p className={styles.userAuthCode}>
        {studioVerifyUserCode}
        <CopyButton
          className={styles.copyButton}
          tooltip="Copy Code"
          value={studioVerifyUserCode}
        />
      </p>
      <Button text="Verify Identity" onClick={openStudioAuthLink} />
    </>
  )
}