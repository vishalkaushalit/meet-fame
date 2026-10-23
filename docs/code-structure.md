# Frontend code structure

## Where to start

| Responsibility | File or folder |
| --- | --- |
| Frontend session checks, redirects, chat and call state | `frontend/src/App.jsx` |
| Frontend page selection and lazy page imports | `frontend/src/components/layout/AppPage.jsx` |
| Signed-in frontend header | `frontend/src/components/layout/AppHeader.jsx` |
| Frontend authentication state | `frontend/src/context/AuthContext.jsx` |
| Admin session checks and page loading | `web-panel/src/App.jsx` |
| Admin route parsing and navigation | `web-panel/src/routes.js` |
| Admin navigation and page composition | `web-panel/src/components/AdminDashboard.jsx` |
| HTTP transport, endpoints and API methods | Each app's `src/api/` folder |
| Components and rules used by both apps | `shared/` |

## Dashboard sections

`InfluencerPanel.jsx` owns availability, certificate submission, active tabs and dashboard state. Its `influencer/` folder contains the rendered sections:

- `AvailabilityPanel.jsx`: day selection, time ranges and generated slots.
- `InfluencerBookings.jsx`: booked sessions, chat and call actions.
- `CertificatePanel.jsx`: verification status and certificate upload.

`UserPanel.jsx` owns the welcome card, sticky navigation and search/category state. Its `user/` folder contains:

- `InfluencerDirectory.jsx`: the paginated influencer cards.
- `UserBookings.jsx`: the customer's booked sessions.

These section components receive data and callbacks through named props. Mutations stay in the parent; extracting a section does not create a second copy of its state.

The admin overview's metrics, activity chart and recent bookings live in `web-panel/src/components/admin/OverviewPanel.jsx`, with common display helpers in `dashboardFormatters.js`. Other admin pages remain in `web-panel/src/components/`: approvals, bookings, availability, announcements, conversations, account details and profile editing each have a dedicated component. The admin dashboard loads those pages on demand.

## Shared forms and behavior

`BankDetailsForm`, `BillingView`, `SecureInput`, `FilterSelect`, `PhoneInput`, `DatePicker`, `PasswordRecovery` and `IntroVideo` live in `shared/`. Fix their common behavior there rather than maintaining separate frontend and admin implementations. Small app-specific wrappers remain in each app's components folder.

Frontend hooks live in `frontend/src/hooks/`:

- `useBookings`: session-scoped booking requests, refresh events, stale-response protection and polling while the bookings tab is selected.
- `useDebouncedValue`: delays requests while the user types without delaying the input itself.
- `useFeaturedInfluencers`: fetches featured profiles only when the homepage is visible and authentication has finished loading.

Pages are loaded with React `lazy` and `Suspense`. Add new frontend pages to `AppPage.jsx`; add admin page imports to `AdminDashboard.jsx`. Keep lazy imports at module scope so React preserves component identity.

## Editing conventions

Keep imports and constants at the top, followed by state, effects, event handlers, derived display values and rendered sections. Use explicit names for data and callbacks. Prefer named components and early returns over deeply nested page-selection expressions. Keep existing form state in its owner when extracting UI sections.

Do not move visual layout details into API modules or duplicate validation rules in page components. Backend authorization remains authoritative even when the UI hides an action.

The shared theme in `shared/theme.css` owns common colors. Component stylesheets own layout and component-specific styling. Avoid replacing shared controls with custom copies in individual pages.

## Formatting and checks

Run these commands from the repository root:

```sh
npm run format
npm run format:check
npm --prefix frontend run lint
npm --prefix web-panel run lint
npm --prefix frontend run build
npm --prefix web-panel run build
```

Prettier uses the repository's `.prettierrc.json` and covers JavaScript and JSX in both apps and `shared/`. Lint currently reports existing React and unused-code warnings; successful builds do not prove browser interactions, so review the affected routes after behavior changes.
