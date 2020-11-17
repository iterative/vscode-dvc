import * as React from 'react'
import { observer } from 'mobx-react'
import { Model } from '../model/Model'
import { hotComponent } from '../hotComponent'

import Experiments from './Experiments'

export const GUI: React.FC<{ model: Model }> = hotComponent(module)(
  observer(({ model }) => {
    try {
      const { experiments } = model
      return <Experiments experiments={experiments} />
    } catch (e) {
      return <p>{e.toString()}</p>
    }
  })
)
