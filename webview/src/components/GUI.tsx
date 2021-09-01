import * as React from 'react'
import { observer } from 'mobx-react'
import ExperimentsGUI from './Experiments'

import { Model } from '../model'

export const GUI: React.FC<{ model: Model }> = observer(({ model }) => {
  try {
    const { errors, tableData, vsCodeApi } = model as Model
    return (
      <>
        {errors?.map(
          (error: React.ReactNode, i: string | number | null | undefined) => (
            <div className="error-message" key={i}>
              {error}
            </div>
          )
        )}
        <ExperimentsGUI tableData={tableData} vsCodeApi={vsCodeApi} />
      </>
    )
  } catch (e) {
    return <p>{e.toString()}</p>
  }
})
