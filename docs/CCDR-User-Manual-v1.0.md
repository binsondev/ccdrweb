# End-user manual

# Central Customer Data Repository (CCDR)

| | |
|---|---|
| **Document ID** | CCDR-UM-001 |
| **Version** | 1.0 |
| **Date** | 14 September 2026 |
| **Audience** | Tenant Admin, Uploader, Query User, Platform Admin |
| **App** | Web application at `/login` (local: http://127.0.0.1:4317) |

This manual is for people who **use** CCDR. It does not explain how to compile the API. Requirements are in **CCDR-SRS-001**.

---

## 1. What CCDR is

CCDR is the shared place to keep **customer / patient / student / vendor** records for one workplace (a tenant). You design the fields. You map Excel columns to those fields. You search inside your tenant only.

CCDR is **not** a hospital system, shop till, or school ERP. It does not diagnose, bill, or take attendance.

There is no built-in list of fields. Your Tenant Admin creates **record types** (for example Patient or Vendor) and **attributes** (Phone, MRN, GSTIN). The same person can be a Patient row and a Vendor row; those are two records.

---

## 2. Sign in

1. Open the app. You should see **Email and password**.
2. Enter your work email and password.
3. Choose **Sign in**.

If the email or password is wrong, the form says so. There are no shortcut “persona” buttons.

After sign-in the left sidebar shows **CCDR**, your **workspace** (tenant name), and the screens your role allows.

**Sign out** is at the bottom of the sidebar. Use **Light / Dark theme** next to it if you want.

### 2.1 Several workplaces

If you belong to more than one tenant, use the **Workspace** list at the top of the sidebar. Only one tenant is active at a time. You never see another tenant’s records.

### 2.2 Development sample

Local sample tenant: **Lokmangal**. Sample admin email: `binson143@gmail.com`. Ask your administrator for the password; it is not printed here.

---

## 3. Who can do what

| You are | You can |
|---|---|
| **Tenant Admin** | Everything in the tenant: types, attributes, mappings, members, settings, uploads, create/edit records, export |
| **Uploader** | Mappings and uploads, create/edit records, search. Cannot edit the catalog or members |
| **Query User** | Search records. Export only if an admin granted export |
| **Platform Admin** | Create tenants and assign a first admin. No customer rows unless you also have a tenant role |

Menus you do not have access to simply do not appear.

---

## 4. First-time setup (Tenant Admin)

Do this **in order**. A new tenant is empty on purpose — there is no hospital/shop/school starter pack.

1. **Catalog → Record types** — create at least one type (code `patient`, label `Patient`). The code cannot change later.
2. **Catalog → Attributes** — select that type. Add fields. Mark at least one **match key** (for example medical record number) so later Excel uploads update the same person instead of inserting duplicates.
3. **Intake → Mappings** — create a mapping for that type. Bind Excel header names to attributes. **Activate** the version.
4. **Intake → Uploads** — or download an empty Excel from the mapping overview, fill it, then stage and commit.
5. **Records → Customers** — search.

Until steps 1–2 exist, search and upload have nothing to bind to.

---

## 5. Record types

**Catalog → Record types**

- **Code**: short, lowercase with underscores (`patient`, `class_teacher`). Locked after save.
- **Label**: what people see (`Patient`). You can rename this.
- **Active**: turn off if you no longer want it for new work. Old records stay.

An empty catalog shows a message until an admin adds a type. Use **Attributes** on a row to jump into fields for that type.

---

## 6. Attributes

**Catalog → Attributes**

Pick a **record type** first. Then add or edit fields.

| Setting | Use it for |
|---|---|
| Code | Stable id (`phone`). Cannot change after save |
| Label | What the list and forms show |
| Data type | Text, number, date, phone, email, yes/no, dropdown, … |
| Required | Upload/save must supply a value |
| Match key | Identity inside this type only |
| Filterable | Appears on the Customers filter panel |
| List visible | Column on the Customers table |
| PII | Marks sensitive data (no masking in this version) |
| Active | Hide from new work without deleting old values |
| Group | Groups filters on the search panel |
| Help text | Hint on forms |

**Dropdown** needs options (value + label).

Editing an attribute changes the catalog. To change a **value on one person**, open that row on Customers and use **Edit attributes**. Match-key fields stay locked so you update the same record.

---

## 7. Mappings (Excel contract)

**Intake → Mappings**

A mapping says: this spreadsheet’s column titles mean these attributes. CCDR matches **header text**, not column A/B/C order.

Typical path:

1. Create a mapping: name it, choose the record type.
2. Paste headers or upload a sample sheet so CCDR reads the titles.
3. Bind each header to an attribute. Optional transforms: Trim, Uppercase, Lowercase, Digits only. Dates can have a format.
4. Open the mapping. **Activate version**. Activation fails if a required attribute has no column.
5. **Download empty Excel** if staff need a blank template with the right headers.
6. **Preview** a file to see the first 20 mapped rows. Preview does not save the file and does not create customers.

Extra columns in a real file are ignored. If a mapped header is missing, the upload tells you.

**Copy as new mapping** makes `{name} copy`, inactive, so you can change columns without touching the live version.

Activated versions used in a commit stay as they were. To add a column: edit (new draft) → activate again.

---

## 8. Uploads

**Intake → Uploads**

1. Choose an **activated** mapping.
2. Choose a `.xlsx` file (about 20 MB / 50,000 rows max).
3. **Stage workbook**. CCDR stores the original file and checks every row. Nothing is written to the customer list yet.
4. Watch status: Received → Parsing → Staged (or Failed).
5. Read **Valid / Invalid / Review** counts. Download the **error workbook** to fix bad rows.
6. **Commit** when you are ready. Match keys update an existing person of that type; otherwise a new row is created.

**Commit policy** (Access → Settings, Tenant Admin):

- **Valid rows only** — good rows go in; bad rows stay in the batch for download.
- **All or nothing** — if any row is invalid, the customer list does not change.

You can cancel a batch that is not committed.

---

## 9. Customers (search)

**Records → Customers**

- Optional **Record type**. Leave “All types” to search across types.
- Filters on the left are only fields marked filterable. Every selected filter applies together.
- The top search box looks for text **anywhere** in the bag.
- Click a row for the full record. Tenant Admin and Uploader can **Edit attributes** or **New record**.
- **Export Excel** / **Export CSV** uses the same filters as the table. Exports are audited. The button appears only if you may export.

If nothing matches: clear a chip or **Clear all**. If there are no types yet, an admin must create them under Catalog.

On a phone, use **Show filters** / **Hide filters**.

---

## 10. Saved searches

On Customers, the **Saved searches** card stores **the query**, not a copy of the people.

1. Set record type, filters, and/or the search box as you like.
2. Type a name (for example `Seniors in ICU`).
3. **Save this search**.
4. Later, click the name. CCDR runs the same query on **today’s** data.

New people who match will appear. People who no longer match disappear. Phone numbers you edit show the new value.

**Update** writes your current filters onto the open saved search. **Delete** removes only the saved query. Customer records are not deleted.

Saved searches are yours in this tenant. A colleague does not see your list. Names cannot be reused (including different capitalisation).

This is not a frozen list of “these 40 ticked names”. If you need a snapshot file, export the result.

---

## 11. Members

**Access → Members** (Tenant Admin)

- **Invite** with email and role. They get a **Pending login** badge until they sign in with that email.
- Change role from the list. **Remove** takes them out of this tenant. You cannot remove yourself.
- Tenant Admins can always export. Grant export to Query Users when they need spreadsheets.

---

## 12. Settings

**Access → Settings** (Tenant Admin writes; Uploader can read)

Choose how commit behaves (section 8). **Save policy**.

---

## 13. Platform (group IT)

**Platform → Tenants** (Platform Admin)

- **Create tenant**: slug (`lokmangal`), display name, business type (Hospital, Shop, School, Other).
- **Assign first admin**: email of the person who will run Catalog for that unit.

Platform Admin still cannot open another tenant’s customer list without a membership there.

---

## 14. If something goes wrong

| What you see | What to try |
|---|---|
| Invalid email or password | Recheck typing. Caps Lock. Ask admin to confirm the email is invited |
| Empty catalog / no filters | Tenant Admin must add a record type and filterable attributes |
| Cannot activate mapping | Bind every **required** attribute to a column |
| Missing headers on upload | Excel title must match the mapping **exactly** (spacing and spelling) |
| Commit does nothing (all-or-nothing) | Download errors, fix the sheet, stage again — or switch policy to valid rows only |
| Duplicate people after upload | Set a match key and use the same values; match keys do not cross record types |
| Export button missing | You need export permission (Tenant Admin, or Query User with export granted) |
| Saved search errors after an attribute was turned off | Open the search, remove the dead filter, **Update** |
| Signed in but no tenant | Platform Admin must assign you to a tenant |

Do not use `/prototype/…` for real work. That path is a mock tour.

---

## 15. Privacy and good practice

- Work only in your tenant. Prefer uploading Excel here instead of mailing customer files.
- Mark PII on sensitive attributes so later controls can find them.
- Prefer match keys over deleting and re-uploading whole lists.
- Export only what you need; those downloads are recorded.

---

## 16. Where to get help

- In-app messages on each page (errors and green notices).
- Technical install: API README in the CCDR backend repository; frontend README for `npm start`.
- Product requirements: `CCDR-SRS-v1.0.md` in the backend `documents` folder.

Document owner: CCDR delivery team.
