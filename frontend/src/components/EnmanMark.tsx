type Props = {
  size?: number;
  className?: string;
};

export function EnmanMark({ size = 36, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="enman mark"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M33 41 A24 24 0 1 0 67 41"
        fill="none"
        stroke="#fff"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="33" cy="31" r="8.5" fill="#fff" />
      <circle cx="67" cy="31" r="8.5" fill="#fff" />
      <path
        d="M50 69 C43 62 35.5 56.5 35.5 51 C35.5 46.5 39 43.5 42.8 43.5 C46.2 43.5 49 46 50 48.6 C51 46 53.8 43.5 57.2 43.5 C61 43.5 64.5 46.5 64.5 51 C64.5 56.5 57 62 50 69 Z"
        fill="#FF6F9C"
      />
    </svg>
  );
}
