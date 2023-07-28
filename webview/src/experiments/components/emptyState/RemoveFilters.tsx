import React from 'react'
import { Button } from '../../../shared/components/button/Button'
import { focusFiltersTree, removeFilters } from '../../util/messages'

export const RemoveFilters: React.FC = () => (
  <div>
    <p>No Experiments to Display.</p>
    <Button onClick={focusFiltersTree} text="Show Filters" />
    <Button
      appearance="secondary"
      isNested={true}
      onClick={removeFilters}
      text="Remove Filters"
    />
  </div>
)
