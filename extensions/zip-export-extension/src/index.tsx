import { id } from './id';
import ZipExportButtonComponent from './ZipExportButton';
import { Icons } from '@ohif/ui-next';
import customDownloadIcon from './assets/downloadCustomIcon';
import JSZip from 'jszip';

export default {
  id,

  preRegistration: () => {
    Icons.addIcon('DOWNLOAD_ICON', customDownloadIcon);
  },

  getToolbarModule: () => {
    return [
      {
        id: 'ExportZip',
        defaultComponent: ZipExportButtonComponent,
        props: {
          label: 'Export as Zip',
          tooltip: 'Export current study as a Zip archive',
          commands: 'exportZipCommand',
        },
        evaluate: 'evaluate.action',
      },
    ];
  },

  getCommandsModule: ({ servicesManager }) => {
    const { uiNotificationService, viewportGridService, displaySetService } =
      servicesManager.services;

    return {
      definitions: {
        exportZipCommand: {
          commandFn: async ({ commandOptions }) => {
            console.log('Export command initiated');

            const zip = new JSZip();
            let patientName: string = 'Unknown_Patient';
            let studyDate: string = 'Unknown_Date';
            let displaySetInstanceUID: string | undefined | null = null;
            let StudyInstanceUID: string | undefined | null = null;

            try {
              uiNotificationService.show({
                title: 'Export Progress',
                message: 'Extracting metadata...',
                type: 'info',
                duration: 1500,
              });

              // Validate required services
              if (!viewportGridService || !displaySetService) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'Required OHIF services not available.',
                  type: 'error',
                  duration: 4000,
                });
                console.error('Export failed: Missing required services');
                return;
              }

              // Get active viewport context
              const activeViewportId = viewportGridService.getActiveViewportId();
              if (!activeViewportId) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'No active viewport found.',
                  type: 'error',
                  duration: 4000,
                });
                console.warn('Export failed: No active viewport');
                return;
              }

              // Retrieve viewport state and display sets
              const viewportState = viewportGridService.getState();
              if (!viewportState) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'Could not retrieve viewport state.',
                  type: 'error',
                  duration: 4000,
                });
                console.error('Export failed: Invalid viewport state');
                return;
              }

              // Get active viewport data
              let activeViewport;
              if (viewportState.viewports && typeof viewportState.viewports.get === 'function') {
                activeViewport = viewportState.viewports.get(activeViewportId);
              } else if (viewportState.viewports && typeof viewportState.viewports === 'object') {
                activeViewport = viewportState.viewports[activeViewportId];
              }

              if (!activeViewport) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'Could not retrieve active viewport data.',
                  type: 'error',
                  duration: 4000,
                });
                console.error('Export failed: Invalid viewport data');
                return;
              }

              // Extract display set UIDs
              const displaySetInstanceUIDs =
                activeViewport.displaySetInstanceUIDs ||
                activeViewport.displaySetOptions?.displaySetInstanceUIDs ||
                [];

              if (displaySetInstanceUIDs.length === 0) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'No display sets found in active viewport.',
                  type: 'error',
                  duration: 4000,
                });
                console.warn('Export failed: No display sets available');
                return;
              }

              displaySetInstanceUID = displaySetInstanceUIDs[0];

              // Retrieve display set and metadata
              const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
              if (!displaySet) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'Could not retrieve display set.',
                  type: 'error',
                  duration: 4000,
                });
                console.error('Export failed: Display set not found');
                return;
              }

              StudyInstanceUID = displaySet.StudyInstanceUID;

              // Extract patient name from DICOM metadata
              // PatientName is stored as a Proxy Array in OHIF's DICOM parser
              if (
                displaySet.instances &&
                displaySet.instances[0] &&
                displaySet.instances[0].PatientName
              ) {
                const patientNameProxy = displaySet.instances[0].PatientName;

                try {
                  // Use toString() method for Proxy Array conversion
                  if (typeof patientNameProxy.toString === 'function') {
                    const nameString = patientNameProxy.toString();
                    if (nameString && nameString !== '[object Object]' && nameString !== '') {
                      patientName = nameString;
                    }
                  }

                  // Fallback: toJSON() method
                  if (
                    patientName === 'Unknown_Patient' &&
                    typeof patientNameProxy.toJSON === 'function'
                  ) {
                    const nameJSON = patientNameProxy.toJSON();
                    if (typeof nameJSON === 'string' && nameJSON !== '') {
                      patientName = nameJSON;
                    } else if (nameJSON && nameJSON.Alphabetic) {
                      patientName = nameJSON.Alphabetic;
                    }
                  }

                  // Fallback: Direct array access
                  if (patientName === 'Unknown_Patient' && patientNameProxy[0]) {
                    const nameObj = patientNameProxy[0];
                    if (typeof nameObj === 'string') {
                      patientName = nameObj;
                    } else if (nameObj.Alphabetic) {
                      patientName = nameObj.Alphabetic;
                    } else if (nameObj.value) {
                      patientName = nameObj.value;
                    }
                  }
                } catch (error) {
                  console.warn('PatientName extraction failed, using default');
                }
              }

              // Extract study date from DICOM metadata
              if (
                displaySet.instances &&
                displaySet.instances[0] &&
                displaySet.instances[0].StudyDate
              ) {
                studyDate = displaySet.instances[0].StudyDate;
              } else if (displaySet.instance && displaySet.instance.StudyDate) {
                studyDate = displaySet.instance.StudyDate;
              }

              console.log(`Export metadata extracted: ${patientName}, ${studyDate}`);

              // Capture viewport image
              uiNotificationService.show({
                title: 'Export Progress',
                message: 'Capturing viewport image...',
                type: 'info',
                duration: 1500,
              });

              const viewportElement = document.querySelector(
                `[data-viewport-uid="${activeViewportId}"] canvas`
              );
              if (!viewportElement) {
                uiNotificationService.show({
                  title: 'Export Error',
                  message: 'Could not find viewport canvas for image capture.',
                  type: 'error',
                  duration: 4000,
                });
                console.error('Export failed: Viewport canvas not found');
                return;
              }

              // Convert canvas to JPEG blob
              const canvas = viewportElement as HTMLCanvasElement;
              const imageBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  blob => {
                    if (blob) {
                      resolve(blob);
                    } else {
                      reject(new Error('Failed to convert canvas to blob'));
                    }
                  },
                  'image/jpeg',
                  0.9
                );
              });

              // Create ZIP archive
              uiNotificationService.show({
                title: 'Export Progress',
                message: 'Creating ZIP file...',
                type: 'info',
                duration: 1500,
              });

              zip.file('image.jpg', imageBlob);

              // Create metadata JSON
              const metadata = {
                PatientName: patientName,
                StudyDate: studyDate,
                StudyInstanceUID: StudyInstanceUID,
                DisplaySetInstanceUID: displaySetInstanceUID,
                ExportTimestamp: new Date().toISOString(),
              };

              zip.file('metadata.json', JSON.stringify(metadata, null, 2));

              // Generate and trigger download
              const zipBlob = await zip.generateAsync({ type: 'blob' });

              uiNotificationService.show({
                title: 'Export Success',
                message: 'Downloading ZIP file...',
                type: 'success',
                duration: 2000,
              });

              const url = URL.createObjectURL(zipBlob);
              const link = document.createElement('a');
              link.href = url;
              const filename = `report_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_${studyDate}.zip`;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              console.log(`Export completed: ${filename}`);
            } catch (error) {
              uiNotificationService.show({
                title: 'Export Error',
                message: `An error occurred during export: ${error.message}`,
                type: 'error',
                duration: 5000,
              });
              console.error('Export failed:', error);
            }
          },
          options: {},
          context: 'DEFAULT',
        },
      },
      defaultContext: 'VIEWER',
    };
  },
};
