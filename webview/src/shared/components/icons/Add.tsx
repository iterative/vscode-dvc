import * as React from 'react'
import type { SVGProps } from 'react'
const Add = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    {...props}
  >
    <path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z" />
  </svg>
)
export default Add
