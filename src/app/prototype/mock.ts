export type ProtoRole = 'Tenant admin' | 'Uploader' | 'Query';

export interface ProtoCustomer {
  id: string;
  mrn: string;
  name: string;
  phone: string;
  ward: string;
  dob: string;
  updated: string;
}

export interface ProtoAttribute {
  code: string;
  label: string;
  group: string;
  type: string;
  matchKey: boolean;
  required: boolean;
  filterable: boolean;
  listVisible: boolean;
  active: boolean;
}

export interface ProtoMember {
  name: string;
  email: string;
  role: ProtoRole;
  pending: boolean;
}

export interface ProtoBinding {
  header: string;
  attribute: string;
}

export const protoCustomers: ProtoCustomer[] = [
  {
    id: '1',
    mrn: 'AH-10482',
    name: 'Priya Menon',
    phone: '98470 11220',
    ward: 'Cardiology',
    dob: '1978-04-12',
    updated: 'Today, 14:08',
  },
  {
    id: '2',
    mrn: 'AH-10483',
    name: 'Joseph Abraham',
    phone: '98950 44119',
    ward: 'Oncology',
    dob: '1964-11-02',
    updated: 'Today, 11:41',
  },
  {
    id: '3',
    mrn: 'AH-10501',
    name: 'Aisha Rahman',
    phone: '97460 22881',
    ward: 'Maternity',
    dob: '1991-07-28',
    updated: 'Yesterday',
  },
  {
    id: '4',
    mrn: 'AH-10514',
    name: 'Thomas Kurian',
    phone: '99470 33002',
    ward: 'Orthopedics',
    dob: '1956-01-19',
    updated: 'Mon',
  },
  {
    id: '5',
    mrn: 'AH-10522',
    name: 'Lakshmi Nair',
    phone: '95670 11994',
    ward: 'Cardiology',
    dob: '1985-09-03',
    updated: 'Mon',
  },
];

export const protoAttributes: ProtoAttribute[] = [
  {
    code: 'mrn',
    label: 'Medical record no.',
    group: 'Identity',
    type: 'Text',
    matchKey: true,
    required: true,
    filterable: true,
    listVisible: true,
    active: true,
  },
  {
    code: 'full_name',
    label: 'Full name',
    group: 'Identity',
    type: 'Text',
    matchKey: false,
    required: true,
    filterable: true,
    listVisible: true,
    active: true,
  },
  {
    code: 'dob',
    label: 'Date of birth',
    group: 'Identity',
    type: 'Date',
    matchKey: false,
    required: false,
    filterable: true,
    listVisible: true,
    active: true,
  },
  {
    code: 'phone',
    label: 'Phone',
    group: 'Contact',
    type: 'Phone',
    matchKey: false,
    required: false,
    filterable: true,
    listVisible: true,
    active: true,
  },
  {
    code: 'email',
    label: 'Email',
    group: 'Contact',
    type: 'Email',
    matchKey: false,
    required: false,
    filterable: false,
    listVisible: false,
    active: true,
  },
  {
    code: 'ward',
    label: 'Ward',
    group: 'Stay',
    type: 'Dropdown',
    matchKey: false,
    required: false,
    filterable: true,
    listVisible: true,
    active: true,
  },
];

export const protoMembers: ProtoMember[] = [
  { name: 'Maya Iyer', email: 'acme.admin@local', role: 'Tenant admin', pending: false },
  { name: 'Rahul Das', email: 'acme.upload@local', role: 'Uploader', pending: false },
  { name: 'Nisha Varghese', email: 'acme.query@local', role: 'Query', pending: false },
  { name: '', email: 'ward.clerk@acme.health', role: 'Query', pending: true },
];

export const protoBindings: ProtoBinding[] = [
  { header: 'MRN', attribute: 'mrn' },
  { header: 'Patient Name', attribute: 'full_name' },
  { header: 'DOB', attribute: 'dob' },
  { header: 'Mobile', attribute: 'phone' },
  { header: 'Unit', attribute: 'ward' },
];

export const protoNav = [
  {
    label: 'Records',
    items: [{ path: '/prototype/customers', label: 'Customers', hint: 'Search the bag' }],
  },
  {
    label: 'Catalog',
    items: [{ path: '/prototype/attributes', label: 'Attributes', hint: 'Define the shape' }],
  },
  {
    label: 'Intake',
    items: [{ path: '/prototype/intake', label: 'Excel intake', hint: 'Map, stage, commit' }],
  },
  {
    label: 'Access',
    items: [
      { path: '/prototype/members', label: 'Members', hint: 'Who may enter' },
      { path: '/prototype/settings', label: 'Settings', hint: 'Commit policy' },
    ],
  },
  {
    label: 'Platform',
    items: [{ path: '/prototype/tenants', label: 'Tenants', hint: 'All workspaces' }],
  },
];
