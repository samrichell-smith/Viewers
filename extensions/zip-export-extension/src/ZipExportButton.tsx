import React from 'react';
import { Button } from '@ohif/ui-next';

// Toolbar button component for ZIP export functionality.
// Integrates with OHIF's toolbar system to trigger the export command.

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
    ></Button>
  );
}

export default ZipExportButtonComponent;
