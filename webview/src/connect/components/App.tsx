import React from 'react'
import { Studio } from './Studio'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC = () => {
  useVsCodeMessaging()

  return <Studio />
}
