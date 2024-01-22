import React from 'react'

export const BoundingBoxColorFilter: React.FC<{
  color: string
}> = ({ color }) => {
  return (
    <filter x="0" y="0" width="1" height="1" id={`c${color.slice(1)}`}>
      <feFlood floodColor={color} result="bg" />
      <feMerge>
        <feMergeNode in="bg" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}
