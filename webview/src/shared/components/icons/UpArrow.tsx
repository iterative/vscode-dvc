import * as React from 'react'

function SvgUpArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 11 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.855 5.086L5.847.094h-.704L.151 5.086l.704.72L5 1.662v10.432h1.008V1.646l4.144 4.16.704-.72z"
        fill="#CCC"
      />
    </svg>
  )
}

export default SvgUpArrow
