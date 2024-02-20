import React from 'react'
import { getIdFromTextAndColor } from '../../../../util/ids'

export const ComparisonTableBoundingBoxColorFilter: React.FC<{
  color: string
  imgAlt: string
}> = ({ color, imgAlt }) => {
  return (
    <filter
      x="0"
      y="0"
      width="1"
      height="1"
      id={getIdFromTextAndColor(imgAlt, color)}
    >
      <feFlood floodColor={color} result="bg" />
      <feMerge>
        <feMergeNode in="bg" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}
