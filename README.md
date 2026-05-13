# VitalWatch

## Descripción general

**VitalWatch** es una aplicación web desarrollada por **VitaSync** orientada a la prevención de riesgo clínico y continuidad operacional hospitalaria. La plataforma permite monitorear indicadores de fatiga del personal médico, detectar niveles críticos de riesgo, gestionar alertas preventivas, apoyar la coordinación de turnos y registrar evidencia para auditoría institucional.

El proyecto está organizado siguiendo principios de **Domain-Driven Design (DDD)**, separando responsabilidades por bounded contexts y capas internas.

## Funcionalidades principales

- Presentación informativa del producto mediante landing page.
- Gestión de usuarios hospitalarios mediante invitaciones y roles.
- Autenticación y control de acceso según rol institucional.
- Consulta de estado de fatiga y riesgo clínico del personal médico.
- Visualización de alertas críticas y eventos de riesgo.
- Gestión de incidentes clínicos y escalamiento al director médico.
- Coordinación de turnos, bloqueos preventivos y sugerencias de reemplazo.
- Recomendaciones de recuperación para el personal médico.
- Registro de acciones preventivas y trazabilidad operacional.
- Soporte de internacionalización en español e inglés.
- Consumo de servicios RESTful desde el frontend.

## Alcance actual

La versión actual del proyecto contempla la construcción de una aplicación web semi funcional con enfoque académico. El sistema prioriza la demostración de los principales flujos de dominio mediante vistas, datos simulados e integración RESTful.

Las principales secciones consideradas son:

- Landing Page
- Identity & Access Management
- Subscription & Plan Management
- Clinical Risk Assessment
- Incident & Escalation Management
- Shift Coordination
- Staff Recovery
- Audit & Compliance

## Arquitectura del proyecto

El frontend se organiza por bounded contexts dentro de `src/app`, manteniendo separación por capas:

```text
src/app/
├── shared/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── iam/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── subscriptions/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── clinical-risk/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── incidents/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── shifts/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── recovery/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
└── audit/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```
Esta organización permite separar modelos de dominio, estado de aplicación, integración con APIs y componentes visuales.

## Bounded Contexts

### Shared

Contiene elementos reutilizables de la aplicación, como layout, navegación, componentes comunes, manejo de errores, tipos base, ensambladores y servicios compartidos.

### Identity & Access Management

Gestiona invitaciones, registro de usuarios, autenticación, roles y permisos dentro de una cuenta hospitalaria.

### Subscription & Plan Management

Gestiona la selección de planes, estado de suscripción, pagos y habilitación de funcionalidades según el plan contratado.

### Clinical Risk Assessment

Procesa datos biométricos, calcula fatiga, clasifica niveles de riesgo y permite consultar el estado clínico del personal médico.

### Incident & Escalation Management

Gestiona incidentes de riesgo clínico, alertas al supervisor, escalamiento al director médico y seguimiento del estado del incidente.

### Shift Coordination

Administra turnos críticos, bloqueos preventivos, sugerencias de reemplazo y redistribución de carga laboral.

### Staff Recovery

Gestiona recomendaciones de descanso, aceptación o rechazo de planes de recuperación y seguimiento del estado del personal médico.

### Audit & Compliance

Registra decisiones críticas, acciones preventivas, bloqueos de turno y reportes de cumplimiento institucional.

## Tecnologías utilizadas
+ Angular
+ TypeScript
+ Angular Router
+ Angular HttpClient
+ Angular Material
+ ngx-translate
+ JSON Server
+ MySQL
+ Firebase Authentication
+ Stripe Sandbox
+ Resend Email API
+ Structurizr
+ PlantUML

## Documentación

La documentación del proyecto se encuentra en la carpeta `docs`.

### User Stories

Las historias de usuario están documentadas en `docs/user-stories.md`

### Class Diagram

El diagrama de clases se encuentra en `docs/class-diagram.puml`

## Notas del proyecto
+ La aplicación está diseñada siguiendo una estructura modular basada en bounded contexts.
+ La versión actual prioriza una implementación académica y demostrativa.
+ Los datos biométricos pueden ser simulados mediante fake API.
+ Las integraciones externas consideradas son Firebase Authentication, Stripe Sandbox y Resend Email API.
+ VitalWatch busca evolucionar de una plataforma de monitoreo visual hacia un sistema preventivo orientado a decisiones clínicas y continuidad operacional hospitalaria.

## Autores

VitaSync Development Team:

+ Montes Zamora, Edgar Alexander Mauricio - `u20241e126`
+ Güere Calero, Fernando Julio - `u202413169`
+ León Morales, Johan Yonel - `u20231h055`
+ Garcia Villanueva, Leonardo Rafael - `u20231h059`
+ Lozano Leon, Richard Enrique - `u20241d990`

## Licencia

Este proyecto se distribuye bajo licencia MIT.
