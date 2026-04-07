# Faclab Invoicing — Electronic Invoice Service

Event-driven microservice that integrates with Ecuador's **SRI** (Servicio de Rentas Internas) tax authority. It listens to sale confirmation events from Kafka, generates compliant electronic invoice XML, signs it with XAdES-BES, submits it to SRI SOAP endpoints for validation and authorization, and persists the full invoice lifecycle in DynamoDB.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Invoice Lifecycle](#invoice-lifecycle)
- [Modules](#modules)
- [HTTP API](#http-api)
- [Kafka Topics](#kafka-topics)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Project Structure](#project-structure)

---

## Architecture Overview

Clean Architecture with CQRS and domain events. Dependencies flow inward: infrastructure → application → domain.

```
┌─────────────────────────────────────────────────────┐
│                    Infrastructure                    │
│   Kafka  │  DynamoDB  │  S3  │  SRI SOAP  │  HTTP   │
├─────────────────────────────────────────────────────┤
│                    Application                      │
│      Commands  │  Queries  │  Event Handlers         │
├─────────────────────────────────────────────────────┤
│                      Domain                         │
│   Entities  │  Value Objects  │  Ports  │  Events    │
└─────────────────────────────────────────────────────┘
```

**Key patterns:**
- **Ports & Adapters:** Domain defines interfaces (ports); infrastructure provides implementations.
- **Manual DI:** All wiring done in `src/container.ts` — no framework.
- **Zod validation:** All external inputs (Kafka messages, HTTP bodies) validated at the boundary.
- **Self-messaging:** The `invoices` Kafka topic drives the invoice state machine by re-publishing domain events after each state transition.

---

## Invoice Lifecycle

Triggered by a `SaleConfirmed` event on the `sales.confirmed` Kafka topic:

```
sales.confirmed ──► CreateInvoice ──► CREATED
                                         │
                    ◄────── invoices ◄───┘
                         SignInvoice ──► SIGNED
                                         │
                    ◄────── invoices ◄───┘
                         SendInvoice ──► SENT (or REJECTED)
                                         │
                    ◄────── invoices ◄───┘
                      AuthorizeInvoice ──► AUTHORIZED (or REJECTED)
```

Each transition is an isolated Command. `InvoiceEventHandler` reads from the `invoices` topic and dispatches to the right command based on the invoice's current status.

---

## Modules

### `invoice`

Core business module. Manages the full invoice lifecycle.

| Layer | Contents |
|-------|----------|
| `domain/` | `Invoice` entity, `AccessCode` VO, `ValidationVoucher`, `AuthorizationVoucher`, port interfaces, domain events |
| `app/` | `CreateInvoiceCommand`, `SignInvoiceCommand`, `SendInvoiceCommand`, `AuthorizeInvoiceCommand`, `InvoiceEventHandler`, `SaleConfirmedHandler`, list/get queries |
| `infra/` | `DynamoInvoiceRepository`, `SignerAdapter`, `SriValidationAdapter`, `SriAuthorizationAdapter`, `XadesSigner`, `P12Reader`, Kafka consumer/producer, HTTP routes |

### `certificate`

Manages PKCS#12 digital signing certificates.

| Layer | Contents |
|-------|----------|
| `domain/` | `Certificate` entity, `P12ParserPort`, `FileStoragePort` |
| `app/` | `UploadCertificateCommand`, `GetCertificateCommand`, `ListCertificatesCommand`, `DeleteCertificateCommand` |
| `infra/` | `DynamoCertificateRepository`, `P12ParserAdapter`, `S3StorageAdapter`, HTTP routes |

### `company-config`

Singleton fiscal configuration for the company (RUC, addresses, SRI environment, etc.).

| Layer | Contents |
|-------|----------|
| `domain/` | `CompanyConfig` entity |
| `app/` | `SaveCompanyConfigCommand`, `GetCompanyConfigQuery` |
| `infra/` | `DynamoCompanyConfigRepository`, HTTP routes |

---

## HTTP API

Interactive docs available at `http://localhost:3173/docs` (Scalar UI) when the service is running.

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/invoices` | List all invoices |
| `GET` | `/api/invoices/:id` | Get invoice by ID |

### Certificates

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/certificates` | Upload a `.p12` certificate (`multipart/form-data`) |
| `GET` | `/api/certificates` | List all certificates |
| `GET` | `/api/certificates/:id` | Get certificate by ID |
| `DELETE` | `/api/certificates/:id` | Delete certificate |

### Company Config

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/company-config` | Create or update fiscal config |
| `GET` | `/api/company-config` | Get current fiscal config |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |

---

## Kafka Topics

| Topic | Direction | Schema |
|-------|-----------|--------|
| `sales.confirmed` | Inbound | `SaleConfirmedMessage` (see `messaging/schemas.ts`) |
| `invoices` | Inbound + Outbound | `InvoiceMessage` (domain events) |

The service acts as both producer and consumer on the `invoices` topic to implement the state machine.

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SIGNING_P12_PASSWORD` | Yes | Password for the `.p12` certificate |
| `AWS_ACCESS_KEY_ID` | Yes | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS credentials |
| `AWS_REGION` | Yes | AWS region (e.g. `us-east-1`) |
| `HTTP_PORT` | Production | HTTP server port (default `3173`) |
| `S3_CERTIFICATES_BUCKET` | Production | S3 bucket for certificate storage |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | No | OpenTelemetry log exporter endpoint |

### SRI Endpoints (hardcoded in config)

- **Voucher validation WSDL:** configured in `config/local.ts` and `config/production.ts`
- **Authorization WSDL:** configured in `config/local.ts` and `config/production.ts`

### Environments

Set via `CompanyConfig.environment`:

| Value | Meaning |
|-------|---------|
| `1` | Testing (SRI sandbox) |
| `2` | Production |

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for LocalStack)
- A running Kafka broker

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start LocalStack** (DynamoDB + S3 emulation)

   ```bash
   docker-compose up -d   # or however your local infra is set up
   ```

3. **Configure environment**

   Create a `.env` file:

   ```env
   AWS_SECRET_ACCESS_KEY=test
   AWS_ACCESS_KEY_ID=test
   AWS_REGION=us-east-1
   SIGNING_P12_PASSWORD=<p12-password>
   ```

4. **Run in dev mode**

   ```bash
   npm run dev
   ```

   The service starts on `http://localhost:3173`.

### Available Scripts

```bash
npm run dev           # ts-node-dev with hot reload
npm run build         # Compile TypeScript → dist/
npm run start         # Run compiled output
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
```

### First-Run Setup

Before processing invoices, bootstrap the service via the REST API:

1. **Upload a signing certificate**

   ```bash
   curl -X POST http://localhost:3173/api/certificates \
     -F "file=@/path/to/certificate.p12" \
     -F "password=your-p12-password"
   # Copy the returned `id` → use as signingCertId in the next step
   ```

2. **Save company fiscal config** (include the certificate `id` from step 1)

   ```bash
   curl -X PUT http://localhost:3173/api/company-config \
     -H "Content-Type: application/json" \
     -d '{
       "taxId": "1234567890001",
       "name": "ACME S.A.",
       "tradeName": "ACME",
       "mainAddress": "Av. Principal 123",
       "branchAddress": "Av. Principal 123",
       "branchCode": "001",
       "salePointCode": "001",
       "accountingRequired": false,
       "environment": 1,
       "emissionType": 1,
       "signingCertId": "<uuid-from-step-1>"
     }'
   ```

---

## Project Structure

```
src/
├── server.ts                    # Entry point
├── container.ts                 # Composition root (manual DI)
├── config/
│   ├── index.ts                 # AppConfig interface
│   ├── local.ts                 # Development config
│   └── production.ts            # Production config
├── modules/
│   ├── invoice/
│   │   ├── domain/
│   │   │   ├── invoice.ts
│   │   │   ├── access-code.ts
│   │   │   ├── access-code-generator.ts
│   │   │   ├── invoice-xml-builder.ts
│   │   │   ├── sri-catalogs.ts
│   │   │   ├── voucher.ts
│   │   │   ├── events.ts
│   │   │   └── ports.ts
│   │   ├── app/
│   │   │   ├── commands/        # create, sign, send, authorize
│   │   │   ├── handlers/        # invoice-event, sale-confirmed
│   │   │   └── queries/         # get, list
│   │   └── infra/
│   │       ├── adapters/        # signer, sri-validation, sri-authorization
│   │       ├── http/            # routes, schemas, mappers
│   │       ├── messaging/       # kafka consumer, producer, schemas, topics
│   │       ├── persistence/     # DynamoDB repo, mapper
│   │       └── signing/         # xades-signer, p12-reader
│   ├── certificate/
│   │   ├── domain/
│   │   ├── app/
│   │   └── infra/
│   │       ├── adapters/        # p12-parser, s3-storage
│   │       ├── http/
│   │       └── persistence/
│   └── company-config/
│       ├── domain/
│       ├── app/
│       └── infra/
│           ├── http/
│           └── persistence/
└── shared/
    ├── logger.ts
    └── infra/
        ├── http-server.ts       # Fastify + Swagger setup
        ├── kafka.ts             # BaseKafkaConsumer
        ├── soap-client.ts       # strong-soap wrapper
        └── p12.ts               # P12 parsing utilities
```
