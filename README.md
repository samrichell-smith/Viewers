# OHIF Export Extension

## Overview

A complete OHIF extension that allows for simple and easy exporting of DICOM images in the current viewport and their metadata, implementing:

1. A custom OHIF extension
2. A dedicated Export Mode
3. A toolbar button with download functionality
4. Full export logic producing ZIP files containing:
   - Viewport JPG captures
   - Structured DICOM metadata

## Installation & Usage

### Prerequisites

- Node.js v18+
- Yarn 1.20+
- Git

## Setup

```bash
# Clone the repository
git clone https://github.com/samrichell-smith/Viewers.git

#Navigate to the project directory
cd Viewers

#Install dependencies
yarn install

#Launch local development server
yarn run dev
```

## Usage

- Access <http://localhost:3000>

- Load a DICOM study, or choose from the preloaded options

- Select "Zip Export Mode" from mode selector

- Click the Export as Zip button in the toolbar, denoted by the download icon

- Download will appear as report_[PatientName]_[StudyDate].zip

- Extract the contents of the zip file and it should contain the following:

```bash
report_DATSCAN1_20221121/
├── image.jpg
└── metadata.json
```

metadata.json Example:

```json
{
  "PatientName": "DATSCAN1",
  "StudyDate": "20221121",
  "StudyInstanceUID": "1.2.276.0.7230010.3.1.2.447481088.1.1669202398.851612",
  "DisplaySetInstanceUID": "c200cc59-a6d7-8221-502c-55fed107b562",
  "ExportTimestamp": "2025-07-30T08:06:43.491Z"
}
```

# Technical Implementation

### 1. Custom OHIF Extension

- Generated using OHIF's CLI (`yarn run cli create-extension`)
- Integrated with OHIF's command system for export functionality
- Custom SVG icon component
- Notification system integration for user feedback

### 2. Export Mode

- Created via OHIF mode template (`yarn run cli create-mode`)
- Dedicated route (`/exportZip`)
- Toolbar service integration

### 3. Toolbar Integration

- Added to main toolbar in prominent position


### 4. Export Logic

**Key Components:**
- DICOM metadata extraction (PatientName, StudyDate)
- Viewport canvas capture as JPEG
- ZIP packaging with JSZip
- Comprehensive error states

### Project Structure

```bash
/extensions/zip-export-extension/
├── src/
│ ├── assets/
│ │ └── downloadCustomIcon.tsx
│ ├── id.js
│ ├── index.tsx
│ └── ZipExportButton.tsx
/modes/zip-export-mode/
├── src/
│ ├── id.js
│ ├── index.tsx
│ ├── initToolGroups.js
│ └── toolbarButtons.ts
```

# Development Process

## Approach

### Initial Research Phase

- I worked through OHIF's docs from "Getting Started", learning about things suc
h as the OHIF CLI, Extensions and Modes. Some parts of this definitely didn't ma
ke complete sense to me on initial glance, so I did some additional research, an
d looked into how these snippets were actually implemented in the pre-exisitng e
xtensions, as well as talking the concepts over with AI tools like Claude to mak
e sure I was thinking about it the right way.

- The next step was to actually go in and have a good look and play around with
the existing extensions, and I would regularly go back to doing this if somethin
g wasn't quite working or I got stuck later on in the process.

### Implementation Strategy

- I first followed the docs for the CLI tool and created template implementation
s of my extension and mode, then linked them and made sure they were loading.

- From here I referred back and forth both to the docs and how other modes and e
xtensions were implemented, such as the longitudinal mode, to get the toolbar lo
aded and working with the base extension's toolbar modules.

- I continued this incremental process of adding and connecting parts, regularly
 testing the extension and mode locally using console logs.

- I finally got to the point where the extension and mode were properly set up a
nd configured, and all that was left to add was the logic of the export function
. Here I went back to the docs to learn how the command modules worked, as well
as doing some research on JSZip and DICOM as a standard.

### Validation

- In the key export command function itself, there's a lot that can go wrong wit
h all the information being parsed and moved around, so I made use of a lot of t
ry-catch and the console for error handling. I also used the OHIF ui pop ups to
give the user info if the export was successful or encountered an error, so they
 wouldn't have to dig through the logs. One example of this is the fallback meth
ods for getting the patient name from the DICOM metadata, which proved very trou
blesome!

- I finally tested the finished feature manually on a series of inputs of a rang
e of different types to ensure everything went smoothly, and made sure the expor
ted metadata was correct. Something I would definitely do with more time would b
e to add actual unit tests, as doing it by hand, as I did, is certainly not thor
ough.

## Challenges & Solutions

### 1. DICOM Metadata Validation
Challenge:

Parsing OHIF's Proxy-wrapped DICOM tags often returned inconsistent results when
 tested with different studies, some working some failing

StudyDate/PatientName formats varied across institutions

Needed to ensure valid JSON output for clinical systems

Solution:

A series of fallback checks to cover all cases

```typescript
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
```

### 2. Silent Failure Prevention

Challenge:
Critical errors could occur without user feedback regarding:

Missing services

Invalid viewports

Canvas capture failures

Solution :
Added console.error() and try catch blocks to validate each step of the process,
 and inform the user of failure points through the use of ui pop ups

```typescript
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
```

### 3. Extension-Mode linking and toolbar set up

Challenge:
It was quite a puzzle to understand how the different files and modules interact
ed, especially in regards to setting up the toolbar and adding my new extension
module to it.

Solution:
While not incredibly difficult per se, getting this right involved a lot of back
 and forth with the docs, as well as trying to understand how the predefined ext
ensions and modes implemented the toolbar, such as the longitudinal mode. This w
as the most helpful solution in the end, and I built the toolbarButtons.ts and i
nitToolGroups.js files to mirror the examples I learnt from

```typescript
// From toolbarButtons.ts
{
    id: 'export-zip-button',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'DOWNLOAD_ICON',
      label: 'Export as Zip',
      tooltip: 'Export current study as a Zip archive',
      commands: 'exportZipCommand',
      evaluate: 'evaluate.action',
    },
  },
```

### 4. Implementing JSZip

Challenge:
Learning a new and unfamiliar library with a key role to play in my extension.

Solution:
I researched and read through the JSZip docs, particularly the how to/examples s
ection about generating a zip file.

```typescript
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
```

## Key Learnings

- Extensions are a lot more integrated with the rest of the program than I imagi
ned, they aren't just something that runs on top.

- Well written documentation and strong and clear examples of implementation, su
ch as I had access to here, are incredibly helpful with getting to grips with a
new technology or project.

- Docs can be outdated, and discrepancies between current practices and document
ation can cause issues, such as with ToolbarIcons in @ohif/ui here.

- Real world data can be messy, and not always formatted or provided in a way yo
u expect, so we need to plan for this.

### Problem-Solving Approach

- I plan how I'm going to roughly approach a problem first, by consulting resour
ces, past examples and those with expertise. Then, even if I don't have a perfec
t plan going in, I start building, going back and forth with these resources if
something isn't working or I'm stuck and need guidance. I find I learn a lot mor
e at this stage, actually seeing how the concepts and components work and intera
ct vs just reading about them.

- I try to get some basic implementation working, even if it doesn't have any of
 the desired final behaviour yet, its somewhere to build from. An example of thi
s here is first getting the extension and mode I created set up, linked and visi
ble on the application, even though the icon was non-functional, it made it simp
ler to build the functionality from there, as I actually had the basics working
so any changes I made could easily be seen and tested.

- As I build features, for instance the export command module here, I regularly
test it by console logging at various points throughout, to see the execution pa
th my code is actually taking, as well as seeing the value of various objects an
d variables at certain points, which helps me to quickly identify when its behav
ing as expected vs something has gone wrong. An example of this in this project
was failing to extract the study name and date for the metadata, and this approa
ch allowed me to quickly identify that there wasn't even an object being passed
into displaySet.

## Future Improvements

- Annotating exports, such as with the measurement tools extension. Currently an
y annotations are not preserved on the export, and this could be a nice improvem
ent for some cases, for instance if a doctor has drawn some lines to identify so
me key features to patients, it would be good if they could be preserved when ex
ported so the patient could still see them when they have their copy of the imag
e.

- Multi-viewport export capability, so that multiple images and their metadata c
an be exported in the same zip, or even an option to export a whole study at onc
e. This would definitely speed up the process if one wanted to export and save m
ore than just specific images from DICOM.

- Cloud integration, downloading the zip export locally may be fine in many case
s, it may not be ideal in clinics that want to deal with large amounts of data,
and being able to export it directly to the cloud, a defined database, or somewh
ere else, as opposed to just a browser download could speed up these workflows s
ignificantly.

© Sam Richell-Smith 2025 | MIT
