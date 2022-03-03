import * as React from 'react'

function SvgLines(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 12 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 9.094V8.086h4v1.008H4zM2 4.086h8v1.008H2V4.086zm10-4v1.008H0V.086h12z"
        fill="currentColor"
      />
    </svg>
  )
}

export default SvgLines
