import React from 'react'

export const getColorFilterId = (imgAlt: string, color: string) =>
  `${imgAlt.replace(/[\s()]/g, '-')}-${color.slice(1)}`

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
      id={getColorFilterId(imgAlt, color)}
    >
      <feFlood floodColor={color} result="bg" />
      <feMerge>
        <feMergeNode in="bg" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}
