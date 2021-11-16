import * as React from 'react'
import { observer } from 'mobx-react'
import ExperimentsGUI from './Experiments'

import { Model } from '../model'

export const GUI: React.FC<{ model: Model }> = observer(({ model }) => {
  try {
    const { data } = model as Model
    return <ExperimentsGUI tableData={data} />
  } catch (e: unknown) {
    return <p>{(e as Error).toString()}</p>
  }
})
