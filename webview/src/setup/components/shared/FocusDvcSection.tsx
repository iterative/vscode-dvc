import React from 'react'
import { useDispatch } from 'react-redux'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import { updateSectionCollapsed } from '../../state/webviewSlice'
import { Button } from '../../../shared/components/button/Button'

export const FocusDvcSection = () => {
  const dispatch = useDispatch()
  return (
    <Button
      text="Setup DVC"
      onClick={() =>
        dispatch(
          updateSectionCollapsed({
            [SetupSection.DVC]: false,
            [SetupSection.EXPERIMENTS]: true,
            [SetupSection.REMOTES]: true,
            [SetupSection.STUDIO]: true
          })
        )
      }
    />
  )
}
