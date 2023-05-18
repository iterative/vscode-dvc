import React from 'react'
import { useDispatch } from 'react-redux'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import { focusSection } from './util'
import { Button } from '../../../shared/components/button/Button'

export const FocusDvcSection = () => {
  const dispatch = useDispatch()
  return (
    <Button
      text="Setup DVC"
      onClick={() => dispatch(focusSection(SetupSection.DVC))}
    />
  )
}
