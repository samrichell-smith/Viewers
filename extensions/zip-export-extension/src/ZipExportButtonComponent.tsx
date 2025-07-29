// extensions/zip-export-extension/src/components/ZipExportButtonComponent.js
import React from 'react';
import { Button } from '@ohif/ui-next';

function ZipExportButtonComponent({ id, label, tooltip, commands, onInteraction }) {
  const handleClick = () => {
    if (onInteraction) {
      onInteraction({
        itemId: id,
        commands: Array.isArray(commands) ? commands : [{ commandName: commands }],
      });
    }
  };

  return (
    <Button
      id={id}
      onClick={handleClick}
      title={tooltip}
      className="text-primary-active hover:bg-primary-hover active:bg-primary-active flex h-8 w-8 flex-col items-center justify-center rounded-md"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5" // Control actual displayed size via Tailwind classes
      >
        <path
          d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
          stroke="currentColor" // Use currentColor to inherit parent text color
          strokeWidth="1.5" // Use camelCase for React props
          strokeLinecap="round" // Use camelCase
          strokeLinejoin="round" // Use camelCase
        />
        <path
          d="M12 3V16M12 16L16 11.625M12 16L8 11.625"
          stroke="currentColor" // Use currentColor to inherit parent text color
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="mt-1 text-xs leading-tight">{label}</span>
    </Button>
  );
}

export default ZipExportButtonComponent;
