import React from 'react'

export const CustomAuth: React.FC<{ href: string }> = ({ href }) => (
  <p>
    For custom authentication see the <a href={href}>docs</a>
  </p>
)
