# NBTC Frontend

A Flutter client for the `nbtc-backend` project. The application targets authenticated staff/Admin users and surfaces the hero slider, content library, branches, and event feeds that already exist in the backend.

## Requirements

- Flutter 3.19+ (channel stable)
- Dart SDK 3.3+
- Access to the running backend (`nbtc-backend`). The app points to `http://localhost:8081/api` by default.

> **Note:** This repository only contains the Flutter source. If you run `flutter create .` for the first time Flutter will scaffold the missing platform folders (android/ios/web/etc.) around the existing `lib/` sources.

## Getting Started

1. Install Flutter if you have not already and ensure `flutter --version` works.
2. From the backend folder run `npm install && npm run dev` (or your preferred start command) so the API is available on `http://localhost:8081`.
3. In another terminal navigate into `nbtc-frontend` and install the Flutter dependencies:

   ```bash
   flutter pub get
   ```

4. (Optional) If you want to point to another backend host/port pass a `--dart-define` flag. Example:

   ```bash
   flutter run -d chrome --dart-define API_BASE_URL=http://192.168.1.10:8081/api
   ```

   Without this flag the app will use `http://localhost:8081/api`.

5. Launch the app on your desired device (`flutter run`, `flutter run -d chrome`, etc.).

## Features

- **Authentication** – Username/password login that calls `POST /api/auth/login` and stores the JWT securely via `shared_preferences`. The profile endpoint (`GET /api/auth/me`) is used to hydrate the session on app start.
- **Dashboard snapshot** – Once authenticated the home screen fetches hero sliders, events (`/api/event`), content articles (`/api/content`), and branches (`/api/branch`) concurrently. Pull-to-refresh re-syncs all data.
- **Admin quick actions** – When the logged-in user has the `Admin` or `SystemAdmin` role a new control panel appears on the dashboard with shortcuts to manage Users, Events, Content, Hero Slides, and Branches. Each tile launches the corresponding management console, enabling search plus create/update/delete flows (including file uploads for content/hero slides).
- **Self-service profile** – All roles can open the profile page from the bottom navigation bar to review their account details, update their contact information, and upload a profile photo via the `/api/user/me/profile` endpoints.
- **Media aware UI** – Hero slider and article images use the MinIO streaming endpoints and cache with `cached_network_image`. Relative URLs from the backend are converted into absolute URLs via the configured base.
- **State management** – Lightweight `provider`/`ChangeNotifier` based architecture. `AuthNotifier` owns the session while `DashboardNotifier` loads the domain entities. Repositories encapsulate HTTP interactions.
- **Error handling** – API failures display actionable messages with retry buttons. Token expiration automatically clears local state and returns the user to the login screen.

## Project Structure

```
lib/
  app.dart                - Registers repositories and providers.
  core/                   - Shared utilities (HTTP client, token storage, widgets).
  features/
    auth/                 - Login screen, auth notifier, models.
    dashboard/            - Dashboard UI, repositories, domain models.
  theme/                  - Material 3 theming for the brand palette.
```

`pubspec.yaml` lists the Flutter/Dart dependencies required to compile the client.

## Testing

A smoke widget test (`test/widget_test.dart`) ensures the root widget builds. Run tests via:

```bash
flutter test
```

With the backend running you can further validate API flows manually from the dashboard screen.
