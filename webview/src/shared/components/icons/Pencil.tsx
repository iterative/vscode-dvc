import * as React from 'react'

function SvgPencil(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.232.086h-1.456L2.52 8.342l-.16.224-2.352 4.112 1.408 1.408 4.112-2.352.224-.16 8.256-8.256V1.862L12.232.086zM1.416 12.678L2.92 9.686l1.456 1.44-2.96 1.552zM5.24 10.63L3.464 8.854l8-8L13.24 2.63l-8 8z"
        fill="currentColor"
      />
    </svg>
  )
}

export default SvgPencil
