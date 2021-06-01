import React from 'react'
import { hotComponent } from '../hotComponent'
import { GUI } from './GUI'
import { Model } from '../model'

export const App: React.FC<Record<string, unknown>> = hotComponent(
  module
)(() => <GUI model={Model.getInstance()} />)
