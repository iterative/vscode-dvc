import React from 'react'
import { GUI } from './GUI'
import { Model } from '../model'

export const App: React.FC<Record<string, unknown>> = () => (
  <GUI model={Model.getInstance()} />
)
