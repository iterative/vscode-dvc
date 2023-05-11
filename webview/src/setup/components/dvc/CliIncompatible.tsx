import React, { PropsWithChildren } from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { checkCompatibility } from '../messages'

export const CliIncompatible: React.FC<PropsWithChildren> = ({ children }) => (
  <EmptyState isFullScreen={false}>
    <div>
      <h1>DVC is incompatible</h1>
      {children}
      <p>Please update your install and try again.</p>
      <Button text="Check Compatibility" onClick={checkCompatibility} />
    </div>
  </EmptyState>
)
