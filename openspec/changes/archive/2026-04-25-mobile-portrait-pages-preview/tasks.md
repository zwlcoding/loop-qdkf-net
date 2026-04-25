## 1. Mobile portrait runtime shell

- [x] 1.1 Add portrait-first viewport/meta configuration and a bounded mobile runtime container for the frontend shell
- [x] 1.2 Refactor the battle scene layout so mission HUD, logs, controls, and debug UI remain readable inside common phone portrait widths
- [x] 1.3 Add focused validation for resize/orientation handling so portrait runtime behavior stays stable

## 2. GitHub Pages preview deployment

- [x] 2.1 Update the frontend build configuration for GitHub Pages base-path deployment
- [x] 2.2 Add a GitHub Actions workflow that builds the frontend and deploys it to GitHub Pages on main-branch updates
- [x] 2.3 Verify the deployed preview URL loads the prototype and static assets correctly from a phone browser (`https://zwlcoding.github.io/loop-qdkf-net/` verified after Actions run `24919106526`)

## 3. Verification and rollout

- [x] 3.1 Run `cd frontend && npm test` and `cd frontend && npm run build` after the mobile and deployment changes
- [x] 3.2 Commit and push the validated change set so the remote preview becomes the current review surface (`ab1cab8` on `main`)
- [x] 3.3 Update task checkboxes and change docs so the deployed portrait-preview scope is fully traceable
