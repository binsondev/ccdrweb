# Proposal

# Central Customer Data Repository (CCDR)

**A shared, secure customer master for every unit in the group — without forcing one rigid customer form on hospitals, shops and schools.**

| | |
|---|---|
| **Document** | Commercial / solution proposal |
| **Document ID** | CCDR-PROP-001 |
| **Version** | 1.0 |
| **Date** | 14 September 2026 |
| **Prepared for** | Group leadership, unit heads, IT and compliance |
| **Prepared by** | CoPass / CCDR delivery |
| **Status** | For discussion — not a contract |

This paper describes **the idea and the offer**. It is written as if the product were still to be built. It is not a technical specification and not a user manual.

---

## 1. Executive summary

Your group runs more than one kind of business. Each hospital, shop or school already holds customer, patient or student data — almost always in Excel, almost always with different column names.

Today there is no single, safe place to keep that data. Staff reopen spreadsheets, copy rows by hand, and cannot be sure they are looking at the latest file. Group IT cannot honestly say “a hospital user only sees hospital data.”

We propose **CCDR — Central Customer Data Repository**:

- One product for the whole group.
- **One isolated workspace per unit** (tenant).
- **No fixed Customer class.** The unit defines its own fields (MRN, GSTIN, Admission Number, or anything else).
- Staff **map Excel columns** to those fields, validate, then commit.
- Staff **search and export** only inside their own unit.

CCDR is a **repository and intake workbench**. It is not a hospital information system, a till, or a school ERP. Those systems can stay. CCDR becomes the place where party data is stored, found, and governed.

---

## 2. The problem we would solve

| Today | Consequence |
|---|---|
| Data lives in disconnected workbooks | Nobody knows which file is current |
| Column names differ by vendor and department | The same “phone” is written five ways |
| Fields are not known up front | A rigid software table breaks on the first unusual field |
| No tenant wall | Group IT cannot prove isolation |
| No mapping history | You cannot explain how last month’s upload was interpreted |
| Search is “open Excel and Ctrl+F” | Slow, error-prone, and hard to audit when someone exports a list |

A conventional CRM with First Name / Last Name / Email as hard columns will fail as soon as a school needs Admission Number and a shop needs GSTIN. The proposal is to **treat attributes as data**, not as compiled code.

---

## 3. What we are proposing

A web application, signed in with a work email and password (organisation SSO can be added later), in which:

1. Group IT **creates a tenant** for each unit and names its first administrator.
2. That administrator **creates record types** (Patient, Vendor, Student, Loyalty member — whatever the unit stores).
3. For each type they **define attributes** (code, label, data type, required, match key, searchable, visible in lists, PII).
4. They **bind Excel headers** to those attributes in a named, versioned mapping.
5. Operations staff **upload a workbook**, see which rows are valid, download errors, then **commit**. Matching keys update an existing person of that type; otherwise a new record is created.
6. Query staff **search** with filters the administrator marked as searchable, open a record, and **export** Excel/CSV when permitted.
7. Users may **save a search** (the question, not a copy of the people) and open it again later so results stay live.

Each tenant starts **empty**. We would not ship a locked “hospital pack” that pretends every hospital is the same. Templates can be discussed later as optional samples, not as a forced schema.

---

## 4. Who it is for

| Audience | What they get |
|---|---|
| Group / business sponsor | One platform, one way of working, visibility that units are isolated |
| Unit head | Own data stays in own workspace; staff can upload and find people without IT for every file |
| Operations / upload staff | Map a vendor spreadsheet once, reuse it, fix errors from a download, then commit |
| Query staff | Search their unit only; export only if allowed |
| Tenant administrator | Owns fields, mappings, members and commit rules for that unit |
| Group IT | Onboard tenants, assign first admins, no need to see customer rows |
| Compliance | Isolation model, role-based access, export recorded, original file retained |

---

## 5. Feature catalogue (what we would deliver)

Written in customer language. This is the list you can walk through in a presentation.

### 5.1 Workspaces and access

- **Multi-tenant workspaces** — one unit, one wall. No cross-unit search in the first delivery.
- **Roles inside a unit:** Tenant Administrator, Uploader, Query User.
- **Group Platform Administrator** creates units and the first tenant admin; does not browse customer rows by default.
- **Invite by email and role.** Membership becomes active when that person signs in.
- **One active workspace at a time** if a person works in more than one unit (for example Uploader in a shop and Query User in a school).
- **Sign-in** with email and password. Access and refresh tokens so the session can continue without storing the password in the browser. Organisation OpenID Connect can be a later phase.
- **Export permission** separate from “can search” so a query user may look up a phone number without downloading the whole list.

### 5.2 You design the data, not us

- **Record types** per unit (Patient, Vendor, Staff, Student, …). The short code never changes after save; the display name can.
- **Attributes belong to one type.** Phone on Patient and phone on Vendor are two fields. The same human being may exist as two records if the unit needs that.
- **Data types:** text, long text, whole number, decimal, date, date-time, yes/no, phone, email, dropdown (unit’s own options).
- **Rules per field:** required, match key (identity for updates), appears in search filters, appears as a list column, marked as PII, active/inactive.
- **No software release** to add “Ward” or “Loyalty Id”. The administrator adds a field.
- **Inactive fields** drop out of new uploads and default search; old values are not wiped.

### 5.3 Excel in, without guessing columns

- **Named mapping profiles** — “Vendor A hospital extract”, “Fee counter sheet”, and so on.
- The system matches **header names**, not “column C is always phone”.
- **Transforms** on a column: trim, upper/lower case, digits only, date format.
- **Activation check:** you cannot go live if a required field has no column.
- **Versioned mappings.** What was used on last Tuesday’s commit stays explainable. Adding a column is a new version.
- **Copy a mapping** to experiment without touching the live one.
- **Empty Excel template** download so staff fill the right headers.
- **Preview** (first rows) before a real upload — does not create customers and does not keep the file.

### 5.4 Controlled intake

- Upload **.xlsx** against an activated mapping (practical limits in the order of 20 MB / tens of thousands of rows).
- **Original file stored** with the job (who, when, which mapping version).
- **Staging:** every row pass/fail with reasons. Nothing hits the live list until someone commits.
- **Error workbook** to send back to the source team.
- **Commit policy** chosen by the unit: *valid rows only*, or *all or nothing* if any row is bad.
- **Match keys** update the same person on the next file; different record types never share a key (a patient MRN will not silently overwrite a vendor).
- Job progress: received → parsing → staged / failed → committed, with cancel before commit.

### 5.5 Find, view, maintain, export

- Search **inside the current unit only**.
- Optional filter by record type, or search across the unit’s types.
- **Faceted filters** from fields marked searchable (contains, equals, greater/less for numbers and dates, dropdowns, yes/no).
- A **free-text** box that looks through values in the record.
- Open a record; authorised staff **create or edit** values. Identity (match key) fields stay locked on edit so you update the same person.
- **Export Excel or CSV** of the current result, only with permission, **with an audit record** that an export happened.
- Lists show the columns the administrator marked as list-visible.

### 5.6 Saved searches (live lists, not copies)

- A user names the **current filters** (“Seniors in ICU”, “GSTIN missing”).
- Opening that name **runs the question again** on today’s data.
- New matching people appear; people who no longer match drop out; edits show the new phone number.
- Deleting a saved search does **not** delete customers.
- First delivery: **personal** saved searches in that unit (not a shared team library, and not a ticked snapshot of 40 names). A file snapshot is an export.

### 5.7 Day-to-day product qualities

- Web application, desktop and phone layout.
- Light and dark theme.
- Current unit name always visible.
- Empty and error states in plain language (“no record types yet”, “this header is not in the file”).
- English UI for the first delivery.

### 5.8 Security and governance (the offer)

- **Tenant isolation** as a hard rule: missing unit context is a failure, not “show everything”.
- Passwords stored as strong hashes, never as plain text.
- Roles enforced on every sensitive action.
- Original workbooks and mapping versions retained so an upload can be explained.
- PII flags on fields so later masking or extra controls have something to hang on. Full field masking can be a later phase.
- Group admin cannot casually browse unit customer rows.

---

## 6. A story you can tell in the meeting

*Riverside School (example unit) is onboarded. The tenant admin creates a record type Student and fields Admission No (match key), Name, Class, Guardian phone. They map the fee-counter Excel (“Adm No” → Admission No, “Mob” → Guardian phone), activate it, and give uploaders the empty template.*

*On Monday an uploader stages 2,000 rows. Forty fail validation; they download the error sheet, fix mobiles, stage again, and commit. Tuesday’s file updates existing students on Admission No instead of creating duplicates.*

*A query user searches Class = 10-A and exports the list; that download is recorded. They save the search as “Class 10-A” and reopen it in June — new admissions are included automatically.*

*A hospital user in the same group never sees those students.*

That story is the product.

---

## 7. What we would not include in the first delivery

Being explicit protects both sides.

- Not a HIS, POS, billing, EMR, or timetable product.
- Not live integration with those systems (file upload is the source).
- Not a group-wide “golden record” merge across units.
- Not a public portal where customers register themselves.
- Not native iOS/Android apps (responsive web is the client).
- Not a locked starter schema that every hospital must use.
- Not cross-unit search.
- Not email campaigns or ticketing.
- Not a full audit console for every catalog click (export is audited; a wider log can follow).
- Not shared saved-search libraries or “tick these 40 people and freeze the list” (export covers the snapshot need).

---

## 8. How we would shape delivery

Phases are **capability slices**, not a calendar. Dates would be agreed separately.

| Slice | Outcome the customer can see |
|---|---|
| **A — Workspace and trust** | Sign in, tenants, roles, isolation proven with two sample units |
| **B — Catalog** | Record types and attributes; empty unit starts blank |
| **C — Mapping** | Header contracts, activate, preview, empty template |
| **D — Intake** | Stage, errors, commit, match-key update |
| **E — Find** | Search, detail, create/edit, export with audit |
| **F — Saved queries** | Name a filter set; reopen live results |
| **Later options** | Organisation SSO (OpenID Connect), richer audit UI, optional sample field lists, lineage on a record (“which file wrote this”), shared searches, exit/export of a whole tenant |

Each slice is usable. We would not wait for “the whole platform” before a unit can store its first real field.

---

## 9. Success looks like

- A unit administrator can add a field in the afternoon and use it in the evening’s Excel.
- Two units on the same system cannot read each other’s rows.
- A second upload with the same match key **updates** rather than duplicates.
- Staff can explain an upload: file + mapping version + who committed.
- Exports are intentional and recorded.
- Search does not require IT to write a query.

---

## 10. Commercial next steps (discussion, not a quote)

This document does not price the work. A follow-up would normally cover:

- How many units in the first rollout, and who the first tenant admins are.
- Whether sign-in stays email/password or must join your existing identity provider in phase one.
- Where the system is hosted (your cloud / ours) and who operates PostgreSQL backups.
- Data-protection addendum (PII, retention of original Excel, who may export).
- A short paid discovery if the group’s units disagree on record types — or skip discovery and start with one willing unit on slice A–B.

**Ask in the meeting:** “May we pick one unit and one Excel, and walk the story in section 6 on a whiteboard with your operations lead?” That is enough to confirm the idea before any build commitment.

---

## 11. One-page feature checklist (leave-behind)

You may copy this slide.

- Isolated workspace per hospital / shop / school / other unit  
- Group admin onboards units; does not see customer rows  
- Tenant admin, uploader, query user roles  
- Invite by email; export permission separate  
- Record types you name  
- Attributes you name (types, required, match key, search, list, PII)  
- No fixed customer table  
- Excel header mapping, versioned, copyable  
- Preview and empty template  
- Stage → validate → error file → commit  
- Valid-only or all-or-nothing commit  
- Match-key update within a type  
- Search, filters, open record, create/edit  
- Excel/CSV export, audited  
- Saved searches = saved questions, live results  
- Original files kept with the job  
- Web app, light/dark, desktop and phone  

---

*End of proposal. This is an offer of scope for discussion, not a statement of work.*
