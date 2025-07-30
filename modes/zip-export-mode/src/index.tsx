import toolbarButtons from './toolbarButtons';
import initToolGroups from './initToolGroups';
import { id } from './id';

// OHIF default extension configurations
const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
};

// Cornerstone viewport configuration
const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

// Required extensions for ZIP export mode functionality
const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  'zip-export-extension': '^0.0.1',
};

/**
 * Factory function to create the Zip Export Mode.
 * This OHIF mode adds a custom toolbar button that allows users to download
 * the active image and its metadata as a .zip file.
 */

function modeFactory() {
  return {
    id,
    routeName: 'zipExport',
    displayName: 'Zip Export Mode',

    // Initializes the mode and toolbar config
    // Adds the export button to the toolbar
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }: withAppTypes) => {
      const { measurementService, toolbarService, toolGroupService } = servicesManager.services;

      measurementService.clearMeasurements();

      initToolGroups(extensionManager, toolGroupService, commandsManager);

      // Register toolbar buttons and update primary toolbar section
      toolbarService.register([...toolbarButtons]);
      toolbarService.updateSection('primary', [
        'export-zip-button',
        'MeasurementTools',
        'Zoom',
        'Pan',
        'TrackballRotate',
        'WindowLevel',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ]);

      // Configure measurement tools dropdown
      toolbarService.updateSection('MeasurementTools', [
        'Length',
        'Bidirectional',
        'ArrowAnnotate',
        'EllipticalROI',
        'RectangleROI',
        'CircleROI',
        'PlanarFreehandROI',
        'SplineROI',
        'LivewireContour',
      ]);

      // Configure additional tools dropdown
      toolbarService.updateSection('MoreTools', [
        'Reset',
        'rotate-right',
        'flipHorizontal',
        'ImageSliceSync',
        'ReferenceLines',
        'ImageOverlayViewer',
        'StackScroll',
        'invert',
        'Probe',
        'Cine',
        'Angle',
        'CobbAngle',
        'Magnify',
        'CalibrationLine',
        'TagBrowser',
        'AdvancedMagnify',
        'UltrasoundDirectionalTool',
        'WindowLevelRegion',
      ]);
    },

    // Removes all elements and cleans up on mode exit
    onModeExit: ({ servicesManager }: withAppTypes) => {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
        uiDialogService,
        uiModalService,
      } = servicesManager.services;

      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    },

    validationTags: {
      study: [],
      series: [],
    },

    // Validates whether a mode is compatible with a study, zip export should work with all
    isValidMode: () => {
      return { valid: true };
    },

    // Defines the layout template and viewport config
    routes: [
      {
        path: 'exportZip',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.leftPanel],
              rightPanels: [ohif.rightPanel],
              viewports: [
                {
                  namespace: cornerstone.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],

    extensions: extensionDependencies,

    sopClassHandlers: [ohif.sopClassHandler],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
