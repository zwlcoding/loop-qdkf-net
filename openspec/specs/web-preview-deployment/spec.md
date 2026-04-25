# web-preview-deployment Specification

## Purpose
TBD - created by archiving change mobile-portrait-pages-preview. Update Purpose after archive.
## Requirements
### Requirement: The prototype SHALL provide a stable remote preview URL
The system SHALL publish the frontend prototype to a stable GitHub Pages URL so the latest accepted main-branch state can be reviewed from a phone browser without local development tools.

#### Scenario: Main branch is updated
- **WHEN** validated frontend changes are pushed to the repository's main branch
- **THEN** the system SHALL build and publish the preview automatically to the configured GitHub Pages site

#### Scenario: Reviewer opens the preview URL
- **WHEN** a reviewer opens the published Pages URL
- **THEN** the site SHALL load the built prototype and its static assets successfully from the repository deployment path

### Requirement: Pages deployment SHALL be compatible with repository subpaths
The system SHALL build the frontend with a deployment path compatible with a project repository Pages site rather than assuming root-path hosting.

#### Scenario: Static asset is requested on Pages
- **WHEN** the deployed site requests bundled JavaScript, images, or data assets
- **THEN** each request SHALL resolve under the repository Pages subpath without requiring manual URL rewriting

