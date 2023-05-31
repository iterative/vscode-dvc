import React, { PropsWithChildren } from 'react'
import { FocusDvcSection } from './FocusDvcSection'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const DvcNotSetup: React.FC<PropsWithChildren> = ({ children }) => (
  <EmptyState isFullScreen={false}>
    <h1>DVC is not setup</h1>
    {children}
    <FocusDvcSection />
  </EmptyState>
)
