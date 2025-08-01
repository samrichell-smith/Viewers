import React from 'react';
import type { IconProps } from 'platform/ui-next/src/components/Icons/types';

/**
 * Custom download icon component for the ZIP export functionality.
 * Renders a download arrow icon that integrates with OHIF's icon system.
 */

const customDownloadIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path
      d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 3V16M12 16L16 11.625M12 16L8 11.625"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default customDownloadIcon;
