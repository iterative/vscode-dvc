import * as React from 'react'
import { observer } from 'mobx-react'
import { hotComponent } from '../hotComponent'

import ExperimentsGUI from './Experiments/index'
import { Model } from '../model/Model'

export const GUI: React.FC<{ model: Model }> = hotComponent(module)(
  observer(({ model }) => {
    try {
      const { errors, experiments, vsCodeApi } = model as Model
      return (
        <>
          {errors &&
            errors.map(
              (
                error: React.ReactNode,
                i: string | number | null | undefined
              ) => (
                <div className="error-message" key={i}>
                  {error}
                </div>
              )
            )}
          <ExperimentsGUI experiments={experiments} vsCodeApi={vsCodeApi} />
        </>
      )
    } catch (e) {
      return <p>{e.toString()}</p>
    }
  })
)
