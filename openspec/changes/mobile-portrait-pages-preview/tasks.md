## 1. Mobile portrait runtime shell

- [ ] 1.1 Add portrait-first viewport/meta configuration and a bounded mobile runtime container for the frontend shell
- [ ] 1.2 Refactor the battle scene layout so mission HUD, logs, controls, and debug UI remain readable inside common phone portrait widths
- [ ] 1.3 Add focused validation for resize/orientation handling so portrait runtime behavior stays stable

## 2. GitHub Pages preview deployment

- [ ] 2.1 Update the frontend build configuration for GitHub Pages base-path deployment
- [ ] 2.2 Add a GitHub Actions workflow that builds the frontend and deploys it to GitHub Pages on main-branch updates
- [ ] 2.3 Verify the deployed preview URL loads the prototype and static assets correctly from a phone browser

## 3. Verification and rollout

- [ ] 3.1 Run `cd frontend && npm test` and `cd frontend && npm run build` after the mobile and deployment changes
- [ ] 3.2 Commit and push the validated change set so the remote preview becomes the current review surface
- [ ] 3.3 Update task checkboxes and change docs so the deployed portrait-preview scope is fully traceable
