import * as React from 'react'
import { SVGProps } from 'react'

const SvgChevronDown = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="m7.976 10.072 4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"
    />
  </svg>
)

export default SvgChevronDown
