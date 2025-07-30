import React from 'react';
import { id } from './id';
import ZipExportButtonComponent from './ZipExportButtonComponent';
import { Icons } from '@ohif/ui-next';
import customDownloadIcon from './assets/downloadCustomIcon';
import JSZip from 'jszip';
import { get as _get } from 'lodash';

/**
 * You can remove any of the following modules if you don't need them.
 */

// custom struct to keep compiler happy with null checking
type OhifStructuredPatientName = {
  Alphabetic: string;
};
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  /**
   * Perform any pre-registration tasks here. This is called before the extension
   * is registered. Usually we run tasks such as: configuring the libraries
   * (e.g. cornerstone, cornerstoneTools, ...) or registering any services that
   * this extension is providing.
   */
  preRegistration: ({ servicesManager, commandsManager, configuration = {} }) => {
    Icons.addIcon('DOWNLOAD_ICON', customDownloadIcon);
  },
  /**
   * PanelModule should provide a list of panels that will be available in OHIF
   * for Modes to consume and render. Each panel is defined by a {name,
   * iconName, iconLabel, label, component} object. Example of a panel module
   * is the StudyBrowserPanel that is provided by the default extension in OHIF.
   */
  getPanelModule: ({ servicesManager, commandsManager, extensionManager }) => {},
  /**
   * ViewportModule should provide a list of viewports that will be available in OHIF
   * for Modes to consume and use in the viewports. Each viewport is defined by
   * {name, component} object. Example of a viewport module is the CornerstoneViewport
   * that is provided by the Cornerstone extension in OHIF.
   */
  getViewportModule: ({ servicesManager, commandsManager, extensionManager }) => {},
  /**
   * ToolbarModule should provide a list of tool buttons that will be available in OHIF
   * for Modes to consume and use in the toolbar. Each tool button is defined by
   * {name, defaultComponent, clickHandler }. Examples include radioGroupIcons and
   * splitButton toolButton that the default extension is providing.
   */
  getToolbarModule: ({ servicesManager, commandsManager, extensionManager }) => {
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
  /**
   * LayoutTemplateMOdule should provide a list of layout templates that will be
   * available in OHIF for Modes to consume and use to layout the viewer.
   * Each layout template is defined by a { name, id, component}. Examples include
   * the default layout template provided by the default extension which renders
   * a Header, left and right sidebars, and a viewport section in the middle
   * of the viewer.
   */
  getLayoutTemplateModule: ({ servicesManager, commandsManager, extensionManager }) => {},
  /**
   * SopClassHandlerModule should provide a list of sop class handlers that will be
   * available in OHIF for Modes to consume and use to create displaySets from Series.
   * Each sop class handler is defined by a { name, sopClassUids, getDisplaySetsFromSeries}.
   * Examples include the default sop class handler provided by the default extension
   */
  getSopClassHandlerModule: ({ servicesManager, commandsManager, extensionManager }) => {},
  /**
   * HangingProtocolModule should provide a list of hanging protocols that will be
   * available in OHIF for Modes to use to decide on the structure of the viewports
   * and also the series that hung in the viewports. Each hanging protocol is defined by
   * { name, protocols}. Examples include the default hanging protocol provided by
   * the default extension that shows 2x2 viewports.
   */
  getHangingProtocolModule: ({ servicesManager, commandsManager, extensionManager }) => {},
  /**
   * CommandsModule should provide a list of commands that will be available in OHIF
   * for Modes to consume and use in the viewports. Each command is defined by
   * an object of { actions, definitions, defaultContext } where actions is an
   * object of functions, definitions is an object of available commands, their
   * options, and defaultContext is the default context for the command to run against.
   */
  getCommandsModule: ({ servicesManager, commandsManager, extensionManager }) => {
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
                  duration: 5000,
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
  getContextModule: ({ servicesManager, commandsManager, extensionManager }) => {},
  /**
   * DataSourceModule should provide a list of data sources to be used in OHIF.
   * DataSources can be used to map the external data formats to the OHIF's
   * native format. DataSources are defined by an object of { name, type, createDataSource }.
   */
  getDataSourcesModule: ({ servicesManager, commandsManager, extensionManager }) => {},
};
