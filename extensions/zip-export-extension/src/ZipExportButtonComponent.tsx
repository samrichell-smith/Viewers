// extensions/zip-export-extension/src/components/ZipExportButtonComponent.js
import React from 'react';
import { Icon } from '@ohif/ui'; // Assuming you're wrapping ToolbarButton
import { Button } from '@ohif/ui-next';

function ZipExportButtonComponent({
  id,
  label, // Will receive 'Export Zip'
  icon, // Will receive 'tool-download'
  tooltip, // Will receive 'Export Zip Archive'
  commands, // Will receive 'exportZipCommand'
  onInteraction, // CRITICAL: Received from OHIF toolbar system
  // ... any other custom props you might pass
}) {
  const handleClick = () => {
    // This is the standard way a defaultComponent triggers its defined command(s)
    if (onInteraction) {
      onInteraction({
        itemId: id,
        commands: Array.isArray(commands) ? commands : [{ commandName: commands }],
        // Add any other data needed for the command
      });
    }
  };

  return (
    <div>
      <Button

      // Add any other props you need for the button
      >
        <Icon name={icon} />
        {label}
      </Button>

      <div>TEXT EHGRES_SDFSDF</div>
    </div>
  );
}

export default ZipExportButtonComponent;
