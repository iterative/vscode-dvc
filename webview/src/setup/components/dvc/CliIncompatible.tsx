import React, { PropsWithChildren } from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

type CliIncompatibleProps = {
  checkCompatibility: () => void
}

export const CliIncompatible: React.FC<
  PropsWithChildren<CliIncompatibleProps>
> = ({ checkCompatibility, children }) => (
  <EmptyState isFullScreen={false}>
    <div>
      <h1>DVC is incompatible</h1>
      {children}
      <p>Please update your install and try again.</p>
      <Button text="Check Compatibility" onClick={checkCompatibility} />
    </div>
  </EmptyState>
)
