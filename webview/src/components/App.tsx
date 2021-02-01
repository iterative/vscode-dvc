import React from 'react'
import { hotComponent } from '../hotComponent'
import { GUI } from './GUI'
import { Model } from '../model/Model'

export const App: React.FC<> = hotComponent(module)(() => (
  <GUI model={Model.getInstance()} />
))
