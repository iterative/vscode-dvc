import React from 'react'
import { STUDIO_URL, SectionCollapsed } from 'dvc/src/setup/webview/contract'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

export const CliIncompatible: React.FC<{
  setSectionCollapsed: (sectionCollapsed: SectionCollapsed) => void
}> = ({ setSectionCollapsed }) => (
  <EmptyState isFullScreen={false}>
    <h1>DVC is currently unavailable</h1>
    <p>
      Locate DVC to connect to <a href={STUDIO_URL}>Studio</a>
    </p>
    <Button
      text="Setup DVC"
      onClick={() =>
        setSectionCollapsed({
          dvc: false,
          experiments: true,
          studio: true
        })
      }
    />
  </EmptyState>
)
