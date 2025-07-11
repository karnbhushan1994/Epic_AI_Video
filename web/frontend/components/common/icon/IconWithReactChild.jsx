import React from 'react';

function IconWithReactChild({ fill = 'none' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
    >
      <path
        d="M10 17.5l-1.45-1.32C4.4 12.36 2 9.91 2 7.05 2 4.74 3.79 3 6 3c1.54 0 3.04.99 3.57 2.36h.87C10.96 3.99 12.46 3 14 3c2.21 0 4 1.74 4 4.05 0 2.86-2.4 5.31-6.55 9.13L10 17.5z"
        fill={fill}
        stroke="red"
        strokeWidth="1"
        style={{ transition: 'fill 0.3s ease' }}
      />
    </svg>
  );
}

export default IconWithReactChild;
