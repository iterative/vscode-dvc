/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { hotComponent } from '../hotComponent'
import { GUI } from './GUI'
import { Model } from '../model/Model'

export const App = hotComponent(module)(() => (
  <GUI model={Model.getInstance()} />
))
