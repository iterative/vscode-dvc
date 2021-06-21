import React from 'react'
import { GUI } from './GUI'
import { hotComponent } from '../hotComponent'
import { Model } from '../model'

export const App: React.FC<Record<string, unknown>> = hotComponent(module)(
  () => <GUI model={Model.getInstance()} />
)
