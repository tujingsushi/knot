import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function baseProps({ size = 24, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
    ...props,
  }
}

export function LogoMark({ size = 30, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M5 22.5a11 11 0 0 1 22 0"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path
        d="M8.8 22.5a7.2 7.2 0 0 1 14.4 0"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        opacity="0.68"
      />
      <path
        d="M12.6 22.5a3.4 3.4 0 0 1 6.8 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="26.8" cy="23.4" r="2" fill="#b8462c" />
    </svg>
  )
}

export function RingIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8.5" opacity="0.42" />
      <circle cx="12" cy="12" r="5.3" opacity="0.72" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 3.5v2" />
    </svg>
  )
}

export function BandsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3.5 6.5h13" />
      <path d="M7.5 12h13" />
      <path d="M4.5 17.5h10" />
      <path d="M19 17.5h1.5" opacity="0.45" />
    </svg>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.8c.55 4.1 2.1 5.65 6.2 6.2-4.1.55-5.65 2.1-6.2 6.2-.55-4.1-2.1-5.65-6.2-6.2 4.1-.55 5.65-2.1 6.2-6.2Z" />
      <path d="M18.4 16.6c.18 1.35.69 1.86 2.04 2.04-1.35.18-1.86.69-2.04 2.04-.18-1.35-.69-1.86-2.04-2.04 1.35-.18 1.86-.69 2.04-2.04Z" opacity="0.55" />
    </svg>
  )
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 6.5h11" />
      <path d="M9 12h11" />
      <path d="M9 17.5h7.5" />
      <circle cx="4.8" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 5.2v13.6" />
      <path d="M5.2 12h13.6" />
    </svg>
  )
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7h9.5" />
      <path d="M17.5 7H20" />
      <circle cx="15.2" cy="7" r="2.2" />
      <path d="M4 17h2.5" />
      <path d="M10.5 17H20" />
      <circle cx="8.3" cy="17" r="2.2" />
    </svg>
  )
}

export function CardIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="3.2" width="16" height="17.6" rx="2.4" />
      <path d="M7.5 7.3h4" />
      <path d="M7.5 11h9" />
      <path d="M7.5 14.5h6" />
      <circle cx="16.8" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function XIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.8" y="5" width="16.4" height="15" rx="2.2" />
      <path d="M7.8 3v4" />
      <path d="M16.2 3v4" />
      <path d="M3.8 9.3h16.4" />
      <path d="M8 13h2.2" />
      <path d="M13.8 13H16" />
      <path d="M8 16.5h2.2" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  )
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.8v11.4" />
      <path d="m7.8 11.2 4.2 4.2 4.2-4.2" />
      <path d="M4.5 19.8h15" />
    </svg>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m4.5 19.5.9-4.2L16.8 3.9a1.9 1.9 0 0 1 2.7 0l.6.6a1.9 1.9 0 0 1 0 2.7L8.7 18.6l-4.2.9Z" />
      <path d="m14.8 5.9 3.3 3.3" />
    </svg>
  )
}

export function ArchiveIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7.5h16" />
      <path d="M5.5 7.5v11a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-11" />
      <path d="M4 4h16v3.5H4z" />
      <path d="M9.5 12h5" />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.5 6.5h15" />
      <path d="M9 6.5V4.8h6v1.7" />
      <path d="m6.5 6.5.9 13a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.9-13" />
      <path d="M10 10.5v6.5" />
      <path d="M14 10.5v6.5" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m4.8 12.4 4.4 4.4L19.4 6.6" />
    </svg>
  )
}

export function RotateIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M19.5 8.5V4.8h-3.7" />
      <path d="M19.1 4.9a8.4 8.4 0 1 0 .9 8.3" />
    </svg>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 15.5V3.8" />
      <path d="m8.2 7.6 3.8-3.8 3.8 3.8" />
      <path d="M5 12.5v5.7A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8v-5.7" />
    </svg>
  )
}

export function KnotIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M6.1 6.2c-2.1 2.1-2.1 5.5 0 7.6s5.5 2.1 7.6 0 2.1-5.5 0-7.6-5.5-2.1-7.6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9.8 7.9c-1.2 1.2-1.2 3 0 4.2s3 1.2 4.2 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="15" cy="5" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function LeafIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M19.5 4.5C11 4.5 5.5 8.4 5.5 14.2c0 2.8 2 4.8 4.7 4.8 5.7 0 9.3-5.4 9.3-14.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 20c3.3-4.7 7-7.9 11.5-9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
