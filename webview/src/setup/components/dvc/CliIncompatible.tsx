import React, { ReactElement } from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

type CliIncompatibleProps = {
  checkCompatibility: () => void
  children: ReactElement
}

export const CliIncompatible: React.FC<CliIncompatibleProps> = ({
  checkCompatibility,
  children
}) => (
  <EmptyState isFullScreen={false}>
    <div>
      <h1>DVC is incompatible</h1>
      {children}
      <p>The located CLI is incompatible with the extension.</p>
      <p>Please update your install and try again.</p>
      <Button text="Check Compatibility" onClick={checkCompatibility} />
    </div>
  </EmptyState>
)
