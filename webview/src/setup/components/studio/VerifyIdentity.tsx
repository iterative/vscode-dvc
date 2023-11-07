import React from 'react'
import { openStudioAuthLink } from '../../util/messages'
import { Button } from '../../../shared/components/button/Button'

export const VerifyIdentity: React.FC = () => {
  return (
    <>
      <p>
        We sent a token request to Studio. Verify your identity to continue.
      </p>
      <Button text="Verify Identity" onClick={openStudioAuthLink} />
    </>
  )
}
