import * as React from 'react'

function SvgCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.432 1.234l-8.464 10-.8-.048L.824 6.418l.816-.576 2.976 4.24L12.664.578l.768.656z"
        fill="currentColor"
      />
    </svg>
  )
}

export default SvgCheck
