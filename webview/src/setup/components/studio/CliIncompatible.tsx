import React from 'react'
import { useDispatch } from 'react-redux'
import { STUDIO_URL, SetupSection } from 'dvc/src/setup/webview/contract'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { updateSectionCollapsed } from '../../state/webviewSlice'

export const CliIncompatible: React.FC = () => {
  const dispatch = useDispatch()

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is currently unavailable</h1>
      <p>
        Locate DVC to connect to <a href={STUDIO_URL}>Studio</a>
      </p>
      <Button
        text="Setup DVC"
        onClick={() =>
          dispatch(
            updateSectionCollapsed({
              [SetupSection.DVC]: false,
              [SetupSection.EXPERIMENTS]: true,
              [SetupSection.STUDIO]: true
            })
          )
        }
      />
    </EmptyState>
  )
}
