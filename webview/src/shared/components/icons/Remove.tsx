import * as React from 'react'
import type { SVGProps } from 'react'
const Remove = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    {...props}
  >
    <path d="M15 8H1V7h14v1z" />
  </svg>
)
export default Remove
