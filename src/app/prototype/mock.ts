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

export type ProtoDataType =
  | 'Text'
  | 'Phone'
  | 'Email'
  | 'Integer'
  | 'Decimal'
  | 'Date'
  | 'DateTime'
  | 'Boolean'
  | 'Dropdown';

/** Same shape as GET /api/customers/filterable-attributes */
export interface ProtoFilterable {
  code: string;
  label: string;
  group: string | null;
  dataType: ProtoDataType;
  operators: string[];
  options: { value: string; label: string }[];
}

export interface ProtoSearchRow {
  id: string;
  updated: string;
  attributes: Record<string, string>;
}

export function operatorsFor(type: ProtoDataType): string[] {
  switch (type) {
    case 'Text':
    case 'Phone':
    case 'Email':
      return ['contains', 'eq'];
    case 'Integer':
    case 'Decimal':
    case 'Date':
    case 'DateTime':
      return ['eq', 'gt', 'gte', 'lt', 'lte'];
    case 'Boolean':
    case 'Dropdown':
      return ['eq'];
    default:
      return ['eq'];
  }
}

export const protoFilterable: ProtoFilterable[] = [
  {
    code: 'mrn',
    label: 'Medical record no.',
    group: 'Identity',
    dataType: 'Text',
    operators: operatorsFor('Text'),
    options: [],
  },
  {
    code: 'full_name',
    label: 'Full name',
    group: 'Identity',
    dataType: 'Text',
    operators: operatorsFor('Text'),
    options: [],
  },
  {
    code: 'dob',
    label: 'Date of birth',
    group: 'Identity',
    dataType: 'Date',
    operators: operatorsFor('Date'),
    options: [],
  },
  {
    code: 'age',
    label: 'Age',
    group: 'Identity',
    dataType: 'Integer',
    operators: operatorsFor('Integer'),
    options: [],
  },
  {
    code: 'phone',
    label: 'Phone',
    group: 'Contact',
    dataType: 'Phone',
    operators: operatorsFor('Phone'),
    options: [],
  },
  {
    code: 'ward',
    label: 'Ward',
    group: 'Stay',
    dataType: 'Dropdown',
    operators: operatorsFor('Dropdown'),
    options: [
      { value: 'Cardiology', label: 'Cardiology' },
      { value: 'Oncology', label: 'Oncology' },
      { value: 'Maternity', label: 'Maternity' },
      { value: 'Orthopedics', label: 'Orthopedics' },
    ],
  },
  {
    code: 'insured',
    label: 'Insured',
    group: 'Stay',
    dataType: 'Boolean',
    operators: operatorsFor('Boolean'),
    options: [],
  },
  {
    code: 'admit_date',
    label: 'Admit date',
    group: 'Stay',
    dataType: 'Date',
    operators: operatorsFor('Date'),
    options: [],
  },
  {
    code: 'blood_group',
    label: 'Blood group',
    group: 'Clinical',
    dataType: 'Dropdown',
    operators: operatorsFor('Dropdown'),
    options: [
      { value: 'O+', label: 'O+' },
      { value: 'A+', label: 'A+' },
      { value: 'B+', label: 'B+' },
      { value: 'AB+', label: 'AB+' },
    ],
  },
];

export const protoSearchRows: ProtoSearchRow[] = [
  {
    id: '1',
    updated: 'Today, 14:08',
    attributes: {
      mrn: 'AH-10482',
      full_name: 'Priya Menon',
      phone: '9847011220',
      ward: 'Cardiology',
      dob: '1978-04-12',
      age: '47',
      insured: 'true',
      admit_date: '2026-09-08',
      blood_group: 'O+',
    },
  },
  {
    id: '2',
    updated: 'Today, 11:41',
    attributes: {
      mrn: 'AH-10483',
      full_name: 'Joseph Abraham',
      phone: '9895044119',
      ward: 'Oncology',
      dob: '1964-11-02',
      age: '61',
      insured: 'true',
      admit_date: '2026-09-04',
      blood_group: 'A+',
    },
  },
  {
    id: '3',
    updated: 'Yesterday',
    attributes: {
      mrn: 'AH-10501',
      full_name: 'Aisha Rahman',
      phone: '9746022881',
      ward: 'Maternity',
      dob: '1991-07-28',
      age: '34',
      insured: 'false',
      admit_date: '2026-09-10',
      blood_group: 'B+',
    },
  },
  {
    id: '4',
    updated: 'Mon',
    attributes: {
      mrn: 'AH-10514',
      full_name: 'Thomas Kurian',
      phone: '9947033002',
      ward: 'Orthopedics',
      dob: '1956-01-19',
      age: '70',
      insured: 'true',
      admit_date: '2026-08-29',
      blood_group: 'O+',
    },
  },
  {
    id: '5',
    updated: 'Mon',
    attributes: {
      mrn: 'AH-10522',
      full_name: 'Lakshmi Nair',
      phone: '9567011994',
      ward: 'Cardiology',
      dob: '1985-09-03',
      age: '40',
      insured: 'false',
      admit_date: '2026-09-09',
      blood_group: 'AB+',
    },
  },
  {
    id: '6',
    updated: 'Sun',
    attributes: {
      mrn: 'AH-10540',
      full_name: 'Farhan Iqbal',
      phone: '9846011223',
      ward: 'Oncology',
      dob: '1988-02-14',
      age: '38',
      insured: 'true',
      admit_date: '2026-09-02',
      blood_group: 'B+',
    },
  },
  {
    id: '7',
    updated: 'Sat',
    attributes: {
      mrn: 'AH-10555',
      full_name: 'Meera Joseph',
      phone: '9744018822',
      ward: 'Maternity',
      dob: '1996-12-01',
      age: '29',
      insured: 'true',
      admit_date: '2026-09-11',
      blood_group: 'A+',
    },
  },
  {
    id: '8',
    updated: 'Fri',
    attributes: {
      mrn: 'AH-10561',
      full_name: 'Suresh Pillai',
      phone: '9895010033',
      ward: 'Orthopedics',
      dob: '1972-06-21',
      age: '53',
      insured: 'false',
      admit_date: '2026-08-21',
      blood_group: 'O+',
    },
  },
];

export const protoNav = [
  {
    label: 'Records',
    items: [
      { path: '/prototype/customers', label: 'Customers', hint: 'Search the bag' },
      { path: '/prototype/search', label: 'Faceted search', hint: 'Filterable attributes' },
    ],
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
