# VitalWatch WebApp

VitalWatch WebApp is an Angular-based healthcare platform designed to support medical centers in monitoring staff fatigue, managing clinical teams, coordinating shifts, tracking biometric indicators, and preventing medical burnout through risk assessment and preventive recovery actions.

The project follows a **Domain-Driven Design (DDD)** and **Clean Architecture** approach, organizing the application by bounded contexts and separating responsibilities across domain, application, infrastructure, and presentation layers.

---

## Main Features

- Authentication and role-based access control.
- Hospital administrator, clinical supervisor, and doctor dashboards.
- Staff management by organization.
- Invitation-based user registration.
- Clinical team creation and member assignment.
- Shift coordination for doctors and supervisors.
- Supervisor shift assignment for assigned medical staff.
- Doctor shift check-in and check-out.
- Fatigue and clinical risk assessment.
- Vital signs monitoring.
- Clinical alerts and biometric anomaly review.
- Preventive recovery actions.
- Subscription and plan management.
- Audit logs and administrative reports.
- Internationalization support for English and Spanish.

---

## Tech Stack

- Angular
- TypeScript
- Angular Material
- RxJS
- Signals
- JSON Server
- Node.js
- ngx-translate
- DDD / Clean Architecture

---

## Project Architecture

The project is organized by bounded contexts:

```txt
src/app/
├── audit-compliance/
├── clinical-risk-assessment/
├── iam/
├── shift-coordination/
├── staff-recovery/
├── subscription-plan-management/
└── shared/
```

Each bounded context follows this structure:

```txt
bounded-context/
├── application/
│   └── bounded-context.store.ts
├── domain/
│   └── model/
├── infrastructure/
│   ├── api/
│   ├── request/
│   ├── responses/
│   └── assemblers/
└── presentation/
    ├── bounded-context.routes.ts
    └── views/
```

---

## Bounded Contexts

### IAM

Handles authentication, session management, invitations, user roles, staff management, account settings, and registration through invitation links.

### Subscription & Plan Management

Handles available plans, organization registration, administrator account creation, subscription status, checkout sessions, and module access control by plan.

### Shift Coordination

Handles clinical teams, team members, shift records, doctor attendance, supervisor shift assignment, and shift status updates.

### Clinical Risk Assessment

Handles fatigue levels, risk assessments, vital sign readings, clinical alerts, and biometric anomalies.

### Staff Recovery

Handles preventive actions assigned by supervisors and recovery tracking for doctors.

### Audit & Compliance

Handles audit logs, administrative reports, traceability, and operational indicators.

---

## User Roles

The application supports three main roles:

```txt
HOSPITAL_ADMIN
SUPERVISOR
DOCTOR
```

### Hospital Administrator

Can manage staff, invitations, teams, subscription, reports, audit logs, and general organization data.

### Clinical Supervisor

Can review assigned staff, clinical alerts, anomalies, preventive actions, and assign shifts to doctors under their supervision.

### Doctor

Can review personal health status, vital signs, assigned shifts, and recovery actions.

---

## Demo Credentials

You can use the following demo accounts when running the local mock API:

```txt
Administrator
Email: admin@vitalwatch.com
Password: admin123

Supervisor
Email: supervisor@vitalwatch.com
Password: supervisor123

Doctor
Email: doctor@vitalwatch.com
Password: doctor123
```

---

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- Angular CLI

You can check your versions with:

```bash
node -v
npm -v
ng version
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd vitalwatch-webapp
```

Install dependencies:

```bash
npm install
```

---

## Running the Mock API

The project uses JSON Server as a local mock backend.

Start the mock API:

```bash
npm run mock
```

The API will run on:

```txt
http://localhost:3000
```

The mock database is located at:

```txt
server/db.json
```

---

## Running the Angular App

Start the Angular development server:

```bash
npm run start
```

The app will run on:

```txt
http://localhost:4200
```

---

## Development Workflow

Recommended workflow:

```bash
npm run mock
npm run start
```

Use one terminal for the mock API and another terminal for the Angular app.

---

## Build

To compile the application for production:

```bash
npm run build
```

The production-ready files will be generated inside:

```txt
dist/
```

---

## Tests

To run unit tests:

```bash
ng test
```

This verifies that the Angular testing setup works correctly and that the main application component can be created without dependency errors.

---

## Internationalization

The project supports English and Spanish translations.

Translation files are located at:

```txt
src/assets/i18n/en.json
src/assets/i18n/es.json
```

---

## Main Routes

### Public Routes

```txt
/sign-in
/accept-invitation
/register-organization/basic
/register-organization/professional
/register-organization/enterprise
/checkout/success
/checkout/cancelled
```

### Administrator Routes

```txt
/admin/dashboard
/admin/staff
/admin/invitations
/admin/teams
/admin/subscription
/admin/reports
/admin/audit
/admin/settings
```

### Supervisor Routes

```txt
/supervisor/dashboard
/supervisor/risk-staff
/supervisor/clinical-alerts
/supervisor/anomalies
/supervisor/preventive-actions
/supervisor/shifts
/supervisor/settings
```

### Doctor Routes

```txt
/doctor/health
/doctor/vital-signs
/doctor/shifts
/doctor/recovery
/doctor/settings
```

---

## Project Status

VitalWatch WebApp currently includes a complete frontend prototype with local mock data and modular architecture by bounded context. The application is ready to be connected to a real backend API while preserving the current DDD-based structure.

---

## Author

VitalWatch Team

---

## License

This project is licensed under the MIT License.
