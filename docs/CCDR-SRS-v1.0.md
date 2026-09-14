# Software Requirements Specification

# Central Customer Data Repository (CCDR)

| | |
|---|---|
| **Document ID** | CCDR-SRS-001 |
| **Version** | 1.0 |
| **Date** | 14 September 2026 |
| **Status** | Describes the running product |
| **Product** | Central Customer Data Repository |
| **Audience** | Product owner, delivery team, QA, stakeholders |
| **Related** | CCDR-BRD-001, CCDR-PRD-001 (drafts, 11 Sep 2026 — several items below supersede those drafts) |

This SRS specifies **what CCDR must do**, as implemented in the ASP.NET Core API and Angular SPA. Where the BRD/PRD still name Finbuckle, starter packs, or OIDC-only login, **this document wins**.

---

## 1. Introduction

### 1.1 Purpose

Define functional and non-functional requirements for CCDR: a multi-tenant customer master in which **the tenant defines the schema**. There is no fixed Customer class.

### 1.2 Product scope

CCDR is a **repository and Excel ingestion workbench**. Each hospital, shop, school, or other unit is a **tenant**. Tenant Admin creates **record types** and **attributes**, maps Excel headers, stages workbooks, commits rows, and searches within that tenant.

CCDR is not HIS, POS, school ERP, a group-wide golden-record merge, or a public customer portal.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Tenant | Isolated workspace (one unit). Request header `X-Tenant` is the slug (example: `lokmangal`) |
| Record type | Kind of bag in a tenant (Patient, Vendor). Code is immutable after save |
| Attribute | Field on **one** record type. `patient:phone` and `vendor:phone` are two definitions |
| Customer bag / record | `id` + `recordType` + `{ attributeCode: value }` |
| Match key | Attribute(s) that identify a row **inside one type** for insert vs update |
| Mapping profile | Named, versioned contract: Excel header → attribute, optional transforms |
| Staging | Parsed rows held until commit; does not write the customer store |
| Saved search | Named copy of search **criteria** (not a copy of customer rows) |
| Platform Admin | Creates tenants and first admins; no customer rows by default |
| Tenant Admin / Uploader / Query User | Roles inside a tenant membership |

### 1.4 References

- Backend: FastEndpoints + Marten (PostgreSQL JSONB, conjoined `tenant_id`). No EF Core. No Finbuckle.
- Frontend: Angular 22 (zoneless) + Spartan Helm. Login at `/login`. App under `/app/*`.
- Local UI: http://127.0.0.1:4317 (proxies `/api` to http://127.0.0.1:7421).
- Seeded development tenant: **Lokmangal** (`lokmangal`). Seeded admin email: `binson143@gmail.com` (Platform Admin and Tenant Admin). Password is hashed (PBKDF2); it is not specified in this SRS.

### 1.5 Overview

Section 2 describes users and constraints. Section 3 lists numbered requirements. Section 4 covers interfaces. Section 5 covers quality attributes. Section 6 notes data. Section 7 lists out of scope.

---

## 2. Overall description

### 2.1 Product functions (summary)

1. Authenticate with email + password; issue access JWT and rotating refresh token.
2. Isolate all customer, catalog, mapping, upload, and saved-search data by tenant.
3. Let Tenant Admin define record types and attributes without a software release.
4. Map Excel headers to attributes; activate versions; preview; download empty templates.
5. Stage `.xlsx` uploads asynchronously; validate; download error workbooks; commit by match key.
6. Search with optional record type, free text `q`, and filterable attributes; export Excel/CSV with audit.
7. Save personal search recipes and re-run them live.
8. Invite members and assign roles; Platform Admin onboards tenants.

### 2.2 User classes

| Class | Access |
|---|---|
| Platform Admin | `/app/platform`. `GET/POST /api/platform/tenants`. No `X-Tenant` required on those routes |
| Tenant Admin | Catalog write, members, settings write, mappings, uploads, customer write, export |
| Uploader | Mapping read/preview, upload, customer write, search; not members/catalog write |
| Query User | Search (and export only if `exportGranted`) |

A person may hold different roles in different tenants. One session uses one tenant at a time. **AC6:** a token that is a member of tenant A plus `X-Tenant: B` yields **403**.

SPA menu hides items the current role cannot use.

### 2.3 Operating environment

- API: .NET 10, FastEndpoints, Marten 9, Npgsql 9, PostgreSQL 17 (Docker locally, port 5433, schema `ccdr`).
- SPA: Angular 22, Tailwind v4, NgRx Signal Store, Helm primitives.
- Browsers: current Chromium, Firefox, Safari; responsive layout (sidebar collapses on small screens).
- Files: `.xlsx` only for intake. Limits: 20 MB, 50,000 data rows.

### 2.4 Constraints and assumptions

- **No starter packs.** New tenants start with an empty record-type catalog.
- **No Finbuckle.** Tenancy is middleware + Marten `LightweightSession(tenant.Id)`.
- **Login is password-based** for this release. OIDC (`Oidc:Authority`) is reserved, not required.
- Passwords stored as PBKDF2-SHA256 (`pbkdf2$210000$salt$hash`). Never plaintext on `UserAccount`.
- Access token ~15 minutes; refresh ~7 days; refresh tokens rotate and old ones are rejected.
- Mapping activation requires every **required** attribute to be bound.
- Match keys never apply across record types.
- `/prototype/*` is a mock UI and is **not** a requirement of the production app.

### 2.5 Dependencies

PostgreSQL reachable at the configured connection string. SPA depends on the API. Email invite does not send mail in this release: membership is **Pending login** until that email signs in.

---

## 3. Functional requirements

Priority: **M** must for this release (implemented), **S** should (partial or later), **C** could.

### 3.1 Identity and session

| ID | Requirement | Pri |
|---|---|---|
| FR-ID-01 | User signs in with email (username) and password via `POST /api/auth/login`. Success returns `accessToken`, `refreshToken`, `expiresInSeconds`, `refreshExpiresInSeconds`. Failure is 401 without revealing which field was wrong beyond a generic message | M |
| FR-ID-02 | SPA login is email + password only. No default emails, persona chips, or password printed on the form | M |
| FR-ID-03 | `POST /api/auth/refresh` consumes the presented refresh token and returns a new pair | M |
| FR-ID-04 | `POST /api/auth/logout` invalidates that refresh token | M |
| FR-ID-05 | SPA stores both tokens, sends `Authorization: Bearer`, refreshes on 401, and logs out if refresh fails | M |
| FR-ID-06 | `GET /api/me` and `GET /api/me/tenants` return identity and memberships without `X-Tenant` | M |
| FR-ID-07 | Data APIs require Bearer **and** a known `X-Tenant` whose membership includes the caller (else 400/403) | M |
| FR-ID-08 | Platform Admin flag comes from account / bootstrap emails; tenant role comes from `UserTenantRole` | M |
| FR-ID-09 | Development `POST /api/dev/token` is off unless `Oidc:IssueDevelopmentTokens` is true | M |
| FR-ID-10 | OIDC authorization-code / PKCE SPA login | C |

### 3.2 Tenants and members

| ID | Requirement | Pri |
|---|---|---|
| FR-TN-01 | Platform Admin creates a tenant: identifier (slug), name, business type Hospital / Shop / School / Other | M |
| FR-TN-02 | Platform Admin assigns a first Tenant Admin by email | M |
| FR-TN-03 | Tenant Admin lists, invites, updates role, and removes memberships. Cannot remove own membership | M |
| FR-TN-04 | Invite by email; status pending until first successful login with that email | M |
| FR-TN-05 | Roles: TenantAdmin, Uploader, QueryUser. Export: Tenant Admin always; others via `exportGranted` | M |
| FR-TN-06 | SPA tenant switcher when the user has more than one membership | M |

### 3.3 Record types

| ID | Requirement | Pri |
|---|---|---|
| FR-RT-01 | Tenant Admin creates record types. Code is snake_case, unique per tenant, **immutable** after save | M |
| FR-RT-02 | Label, description, and active may change | M |
| FR-RT-03 | New tenant has **zero** record types until an admin creates them | M |
| FR-RT-04 | Catalog, mappings, match keys, and customer bags are scoped to one record type | M |

### 3.4 Attributes

| ID | Requirement | Pri |
|---|---|---|
| FR-AT-01 | Tenant Admin creates attributes on exactly one record type. Code unique within that type; immutable after save | M |
| FR-AT-02 | Types: Text, Multiline, Integer, Decimal, Date, DateTime, Boolean, Phone, Email, Dropdown (with options) | M |
| FR-AT-03 | Flags: required, matchKey, filterable, listVisible, pii, active; optional group, help text, default, sort order | M |
| FR-AT-04 | Deactivating hides the field from new filters/uploads; existing bag values are not deleted | M |
| FR-AT-05 | Tenant Admin may edit catalog definition; customer bag values are edited from the customer record | M |
| FR-AT-06 | Same short code on two types is two documents | M |

### 3.5 Mapping profiles

| ID | Requirement | Pri |
|---|---|---|
| FR-MP-01 | Named mapping belongs to one record type and may bind only that type’s attributes | M |
| FR-MP-02 | Bindings match Excel **header names**, not column index | M |
| FR-MP-03 | Transforms: Trim, Upper, Lower, DigitsOnly; optional date format | M |
| FR-MP-04 | Cannot activate if a required attribute has no binding | M |
| FR-MP-05 | Activated (or committed) versions are immutable; further edits create a new draft then activate | M |
| FR-MP-06 | Copy creates an inactive `{name} copy` | M |
| FR-MP-07 | Default mapping is per record type | M |
| FR-MP-08 | Preview first 20 mapped rows without storing the file or committing | M |
| FR-MP-09 | Download empty `.xlsx` whose headers are the mapping’s Excel titles | M |
| FR-MP-10 | Unmapped extra columns are ignored by default | M |

### 3.6 Uploads

| ID | Requirement | Pri |
|---|---|---|
| FR-UP-01 | Uploader/Tenant Admin uploads `.xlsx` against an **activated** mapping. Original file is stored | M |
| FR-UP-02 | Job states: Received, Parsing, Staged, Failed, Committed, Cancelled | M |
| FR-UP-03 | Each row is Valid, Invalid, Review, or Committed, with cell-level errors | M |
| FR-UP-04 | Error workbook download for invalid rows | M |
| FR-UP-05 | Commit uses match keys within that record type: update if found, else insert | M |
| FR-UP-06 | Commit policy ValidOnly or AllOrNothing, tenant setting | M |
| FR-UP-07 | Limits 20 MB / 50,000 rows | M |
| FR-UP-08 | Staging never writes customers until commit | M |
| FR-UP-09 | Cancel non-committed batches | M |
| FR-UP-10 | Ambiguous match-key collisions to a review queue | S |

### 3.7 Customers, search, export

| ID | Requirement | Pri |
|---|---|---|
| FR-CU-01 | Create/update a bag by record type + attributes; optional id updates in place | M |
| FR-CU-02 | `GET /api/customers` supports `q`, optional `recordType`, repeated `filter=code:op:value`, offset/limit | M |
| FR-CU-03 | Filters only on **active filterable** attributes; operators depend on data type | M |
| FR-CU-04 | List columns from list-visible attributes; record type column when searching all types | M |
| FR-CU-05 | Detail drawer shows active attributes; match keys locked when editing values | M |
| FR-CU-06 | Pagination (page size 10/25/50) and debounced filter search | M |
| FR-CU-07 | `GET /api/customers/export` same filters; Excel or CSV; requires export permission; writes audit event `customers.export` | M |
| FR-CU-08 | Source batch / mapping lineage on the detail screen | S |
| FR-CU-09 | Sort and filter by batch or upload date | S |

### 3.8 Saved searches

| ID | Requirement | Pri |
|---|---|---|
| FR-SS-01 | Authenticated CustomerRead user saves a named recipe: name, optional recordType, optional `q`, `filter` strings identical to list/export | M |
| FR-SS-02 | The document **must not** store customer bags or attribute value copies | M |
| FR-SS-03 | List/get/update/delete apply only to recipes owned by the caller in the current tenant | M |
| FR-SS-04 | Duplicate names for the same owner (case-insensitive) are rejected (409) | M |
| FR-SS-05 | Applying a recipe re-runs `GET /api/customers` (live results). Pagination is not part of the recipe | M |
| FR-SS-06 | SPA: save, apply, update active, delete, empty/loading states on Customers | M |
| FR-SS-07 | Tenant-wide shared recipes | C |
| FR-SS-08 | Frozen selection of customer ids (tick subset) | C |

### 3.9 Settings and audit

| ID | Requirement | Pri |
|---|---|---|
| FR-ST-01 | Tenant upload commit policy readable by Uploader/Admin; writable by Tenant Admin | M |
| FR-AU-01 | Export events are audited | M |
| FR-AU-02 | Full audit log UI for attribute/mapping/commit | S |

### 3.10 Presentation

| ID | Requirement | Pri |
|---|---|---|
| FR-UI-01 | Shell shows current tenant name; light/dark theme | M |
| FR-UI-02 | Empty, loading, and error states on list screens | M |
| FR-UI-03 | Desktop two-column customers page; mobile filter toggle | M |
| FR-UI-04 | Unauthenticated users hit `/login`; authenticated users cannot use guest login | M |

---

## 4. External interfaces

### 4.1 User interface (SPA routes)

| Route | Screen |
|---|---|
| `/login` | Email + password |
| `/app/customers` | Search, saved searches, detail, create |
| `/app/record-types` | Record type catalog |
| `/app/attributes` | Attributes for one type |
| `/app/mappings`, `/app/mappings/:id` | Mapping list and overview |
| `/app/uploads` | Stage, poll, commit, errors |
| `/app/members` | Invite and roles |
| `/app/settings` | Commit policy |
| `/app/platform` | Tenants (Platform Admin) |

### 4.2 Software interfaces (API groups)

Health: `GET /health`, `GET /health/ready`.

Identity: `/api/auth/login|refresh|logout`, `/api/me`, `/api/me/tenants`, `/api/members`, `/api/platform/tenants`.

Catalog: `/api/record-types`, `/api/attributes`.

Mappings: `/api/mapping-profiles` including activate, versions, clone, default, preview, template.xlsx, headers.

Customers: `/api/customers`, `/api/customers/export`, `/api/customers/filterable-attributes`, `/api/customers/{id}`.

Saved searches: `GET/POST /api/saved-searches`, `GET/PUT/DELETE /api/saved-searches/{id}`.

Uploads: `/api/uploads`, staged-rows, commit, cancel, errors.xlsx.

Settings: `GET/PUT /api/settings`.

JSON is camelCase. Enums as strings.

### 4.3 Hardware / comms

HTTPS in production. Local HTTP on loopback is acceptable for development. No native mobile client.

---

## 5. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-SEC-01 | Tenant isolation on every customer/catalog/mapping/upload/saved-search document (`tenant_id`) |
| NFR-SEC-02 | Passwords hashed PBKDF2-SHA256 ≥ 210,000 iterations; never log plaintext passwords |
| NFR-SEC-03 | JWTs signed with the configured development/production key; refresh rotation |
| NFR-SEC-04 | Role checks on every mutating and sensitive GET |
| NFR-ISO-01 | Missing `X-Tenant` on data routes is 400, not “all data” |
| NFR-REL-01 | Upload parse runs as a worker; UI polls batch status |
| NFR-PERF-01 | Customer search paginated (API max page 200; UI 10/25/50) |
| NFR-PERF-02 | SPA search input debounced (~2 s) |
| NFR-USAB-01 | English UI copy; no lorem; actionable empty states |
| NFR-MAINT-01 | Marten Weasel schema on startup in Development; no EF migrations folder |
| NFR-COMP-01 | PII flag stored for later controls; field-level masking is not required in this release |

---

## 6. Data requirements (logical)

Documents (not a fixed SQL Customer table):

- `RecordType`, `AttributeDefinition` (id `{recordType}:{code}`)
- `CustomerRecord` (attribute bag)
- `MappingProfile`, `MappingProfileVersion`
- `UploadBatch`, `StagedRow`, `TenantSettings`
- `SavedSearch` (criteria + `ownerUserId` only)
- `UserAccount` (password hash), `UserTenantRole`, `TenantRecord`, `RefreshSession`
- `AuditEvent` (export in this release)

Identity documents are single-tenanted (global). All operational bags are conjoined multi-tenant.

---

## 7. Out of scope (this release)

- Bundled Keycloak or any mandatory OIDC IdP
- Hard-coded Customer POCO / FirstName LastName schema
- Hospital / Shop / School starter attribute packs
- Finbuckle.MultiTenant
- Cross-tenant search or golden record
- Live HIS / POS / ERP connectors
- Clinical, billing, or academic workflows
- Native iOS/Android apps
- Public self-registration of end customers
- Email sending for invites
- Shared saved searches and ticked-id snapshots
- Self-serve tenant data deletion / exit export UI

---

## 8. Requirements traceability (roles)

| Capability | Platform | Tenant Admin | Uploader | Query User |
|---|---|---|---|---|
| Sign in / refresh | Y | Y | Y | Y |
| Create tenant | Y | | | |
| Record types / attributes | | Y | read | read |
| Mappings / uploads | | Y | Y | |
| Search bags | | Y | Y | Y |
| Create/edit bag | | Y | Y | |
| Export | | Y | if granted | if granted |
| Saved searches | | Y | Y | Y |
| Members / settings write | | Y | settings read | |

---

## 9. Acceptance notes (QA)

- Login with a wrong password is 401; stored hash starts with `pbkdf2$` and does not contain the password.
- Two tenants never see each other’s `GET /api/customers` rows.
- Commit with match key updates the same id; different type + same phone creates a second bag.
- Saved search JSON has no `customers` array; applying after an attribute edit shows the new value.
- Activate mapping without a required binding fails.
- All-or-nothing commit with one invalid row leaves customer count unchanged.

---

## 10. Document history

| Version | Date | Notes |
|---|---|---|
| 1.0 | 14 Sep 2026 | Written from the running API and SPA, including password login, Lokmangal seed, record types, and saved searches |

End-user procedures: **CCDR-UM-001** (`CCDR-User-Manual-v1.0.md`).
