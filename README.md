# VitalWatch WebApp

VitalWatch WebApp is the Angular frontend for the VitalWatch Platform, a hospital fatigue-monitoring system designed to help healthcare organizations supervise medical staff, evaluate clinical risk, manage shifts, track recovery actions, and review operational activity.

This frontend is integrated with the VitalWatch Spring Boot backend.

---

## Project Information

```txt
Project: VitalWatch WebApp
Frontend: Angular
Backend: Spring Boot
Local frontend URL: http://localhost:4200
Local backend URL: http://localhost:8080/api/v1
```

---

## Tech Stack

```txt
Angular
TypeScript
Angular Material
RxJS
Ngx Translate
Ng Icons
ApexCharts
SCSS/CSS
```

---

## Backend Integration

The frontend is connected to the real VitalWatch backend through the API base URL configured in:

```txt
src/environments/environment.development.ts
```

Development API URL:

```txt
http://localhost:8080/api/v1
```

The backend must be running before testing protected modules such as dashboards, staff management, teams, subscriptions, clinical alerts, shifts, and recovery actions.

---

## Main Integrated Modules

```txt
Authentication
Admin Dashboard
Staff Management
Team Management
Invitations
Subscriptions
Supervisor Dashboard
Clinical Alerts
Vital Sign Anomalies
Preventive Actions
Shift Management
Doctor Health Dashboard
Doctor Vital Signs
Doctor Shifts
Doctor Recovery
Audit / Reports
Settings
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm start
```

or:

```bash
ng serve --o
```

The app will be available at:

```txt
http://localhost:4200
```

---

## Build

To verify that the project compiles correctly:

```bash
npm run build
```

The build output will be generated in the Angular output directory.

---

## Backend Setup

Before running the frontend, start the backend from the Spring Boot project:

```powershell
cd C:\Users\JYONE\GitHub\vitalwatch-platform
.\mvnw.cmd spring-boot:run
```

Swagger should be available at:

```txt
http://localhost:8080/api/v1/swagger-ui.html
```

---

## Test Users

Use these users for local testing:

### Hospital Administrator

```txt
Email: johan.admin@vitalwatch.pe
Password: 123456789
```

### Supervisor

```txt
Email: luis.supervisor@vitalwatch.pe
Password: 123456789
```

Alternative supervisor:

```txt
Email: andrea.supervisor@vitalwatch.pe
Password: 123456789
```

### Doctor

```txt
Email: mateo.doctor@vitalwatch.pe
Password: 123456789
```

Alternative doctors:

```txt
Email: camila.doctor@vitalwatch.pe
Password: 123456789

Email: valeria.doctor@vitalwatch.pe
Password: 123456789
```

---

## Role-Based Routes

### Admin

```txt
/admin/dashboard
/admin/staff
/admin/teams
/admin/invitations
/admin/subscription
/admin/settings
```

### Supervisor

```txt
/supervisor/dashboard
/supervisor/risk-staff
/supervisor/clinical-alerts
/supervisor/anomalies
/supervisor/preventive-actions
/supervisor/shifts
/supervisor/settings
```

### Doctor

```txt
/doctor/health
/doctor/vital-signs
/doctor/shifts
/doctor/recovery
/doctor/settings
```

---

## Important Backend Endpoints Used

### Authentication

```txt
POST /authentication/sign-in
GET  /authentication/me
```

### Staff and Organizations

```txt
GET   /users
GET   /users/{userId}
PATCH /users/{userId}

GET /organizations
GET /workAreas
GET /specialties
```

### Invitations

```txt
GET  /invitations
GET  /invitations/by-token/{token}
POST /invitations/send
POST /invitations/accept
```

### Subscriptions and Billing

```txt
GET   /plans
GET   /subscriptions/organization/{organizationId}
PATCH /subscriptions/{subscriptionId}

POST /billing/create-checkout-session
GET  /billing/checkout-session-status
POST /billing/activate-checkout-session

GET /checkoutSessions?organizationId={organizationId}
```

### Shift Coordination

```txt
GET    /careTeams
POST   /careTeams
PATCH  /careTeams/{careTeamId}
DELETE /careTeams/{careTeamId}

GET    /teamMembers
POST   /teamMembers
DELETE /teamMembers/{teamMemberId}

GET   /shiftRecords
POST  /shiftRecords
PATCH /shiftRecords/{shiftRecordId}
```

### Clinical Risk Assessment

```txt
GET   /riskAssessments
GET   /clinicalAlerts
PATCH /clinicalAlerts/{clinicalAlertId}

GET   /vitalSignReadings
GET   /vitalSignAnomalies
PATCH /vitalSignAnomalies/{vitalSignAnomalyId}
```

### Staff Recovery

```txt
GET   /preventiveActions
POST  /preventiveActions
PATCH /preventiveActions/{preventiveActionId}
```

---

## IoT Simulation

The backend includes a clinical simulation endpoint that generates wearable biometric readings for doctors.

Manual simulation endpoint:

```txt
POST /clinicalSimulation/tick?organizationId=1
```

This may generate:

```txt
Vital sign readings
Risk assessments
Clinical alerts
Vital sign anomalies
```

After running the simulation several times, refresh the supervisor or doctor dashboards to see updated clinical data.

---

## Notes About Billing

The current frontend is connected to the backend billing flow using simulated checkout sessions.

Stripe real checkout is not enabled yet.

Current flow:

```txt
POST /billing/create-checkout-session
PATCH /subscriptions/{subscriptionId}
GET /checkoutSessions?organizationId={organizationId}
```

Pending future improvement:

```txt
Real Stripe Checkout
Stripe webhook
Stripe payment status validation
```

Stripe secret keys must be configured only in the backend, never in Angular.

---

## Development Workflow

The project uses a Git workflow based on:

```txt
master  -> stable branch
develop -> integration branch
feature/* or fix/* -> working branches
```

Recommended workflow:

```bash
git switch develop
git pull origin develop
git switch -c feature/example-branch
```

After finishing changes:

```bash
npm run build
git status
git add .
git commit -m "type(scope): clear message"
git push -u origin feature/example-branch
```

Then merge into `develop`.

---

## Conventional Commits Used

Examples:

```txt
feat(iam): connect authentication to spring boot api
fix(billing): align subscription page with backend contract
fix(layout): improve responsive app shell navigation
fix(iam): avoid staff loading on doctor views
chore(auth): remove demo content from auth screens
docs(frontend): document backend integration setup
```

---

## Final Validation Checklist

Before merging `develop` into `master`, verify:

```txt
npm run build passes
Login works for admin, supervisor, and doctor
No visible demo credentials remain
Admin staff management works
Admin team management works
Admin invitations work
Admin subscription page works
Supervisor modules remain visible after refresh
Supervisor alerts, anomalies, preventive actions, and shifts load correctly
Doctor health, vital signs, shifts, and recovery pages load correctly
No important red errors appear in the browser Network tab
```

---

## Authors

```txt
VitalWatch Team
Universidad Peruana de Ciencias Aplicadas
```
