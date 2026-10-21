import assert from 'node:assert/strict';
import test from 'node:test';
import { interpretQuestion, sanitizeCriteria, summarizeToolResult } from './interpret.mjs';

const catalog = {
  recordTypes: [
    { code: 'patient', label: 'Patient' },
    { code: 'invoice', label: 'Invoice' },
  ],
  attributes: [
    {
      recordType: 'patient',
      code: 'age',
      label: 'Age',
      dataType: 'Integer',
      operators: ['eq', 'gt', 'gte', 'lt', 'lte'],
      options: [],
    },
    {
      recordType: 'patient',
      code: 'ward',
      label: 'Ward',
      dataType: 'Dropdown',
      operators: ['eq'],
      options: [{ value: 'ICU', label: 'ICU' }, { value: 'OPD', label: 'OPD' }],
    },
    {
      recordType: 'patient',
      code: 'full_name',
      label: 'Full name',
      dataType: 'Text',
      operators: ['contains', 'eq'],
      options: [],
    },
    {
      recordType: 'patient',
      code: 'email',
      label: 'Email',
      dataType: 'Email',
      operators: ['contains', 'eq'],
      options: [],
    },
    {
      recordType: 'invoice',
      code: 'amount',
      label: 'Amount',
      dataType: 'Decimal',
      operators: ['eq', 'gt', 'gte', 'lt', 'lte'],
      options: [],
    },
  ],
  current: { recordType: '', q: '', filter: [] },
};

test('seniors in ICU maps to age and ward on the patient type', () => {
  const result = interpretQuestion('Seniors in ICU', catalog);
  assert.equal(result.recordType, 'patient');
  assert.equal(result.q, '');
  assert.ok(result.filter.includes('age:gte:60'));
  assert.ok(result.filter.includes('ward:eq:ICU'));
});

test('named patients become a contains filter', () => {
  const result = interpretQuestion('patients named Sharma', catalog);
  assert.equal(result.recordType, 'patient');
  assert.deepEqual(result.filter, ['full_name:contains:Sharma']);
});

test('show all patients sets the record type only', () => {
  const result = interpretQuestion('show all patients', catalog);
  assert.equal(result.recordType, 'patient');
  assert.equal(result.q, '');
  assert.deepEqual(result.filter, []);
});

test('show everyone clears the search', () => {
  assert.deepEqual(interpretQuestion('show everyone', catalog), {
    recordType: '',
    q: '',
    filter: [],
  });
});

test('a range uses gte and lte', () => {
  const result = interpretQuestion('patients age between 18 and 30', catalog);
  assert.ok(result.filter.includes('age:gte:18'));
  assert.ok(result.filter.includes('age:lte:30'));
});

test('email text uses contains', () => {
  const result = interpretQuestion('emails containing hospital.org', catalog);
  assert.deepEqual(result.filter, ['email:contains:hospital.org']);
});

test('unknown attribute codes are dropped when the catalog is known', () => {
  const result = sanitizeCriteria(
    { recordType: 'patient', q: 'sharma', filter: ['nope:eq:1', 'age:gte:70'] },
    catalog,
  );
  assert.deepEqual(result.filter, ['age:gte:70']);
  assert.equal(result.q, 'sharma');
});

test('a capability question stays in chat', () => {
  const result = interpretQuestion('what we can do here', catalog);
  assert.equal(result.chatOnly, true);
  assert.equal(result.q, undefined);
  assert.equal(result.filter, undefined);
});

test('unmatched words stay in q', () => {
  const result = interpretQuestion('patients in mumbai', catalog);
  assert.equal(result.recordType, 'patient');
  assert.equal(result.q, 'mumbai');
});

test('tool summaries use the count from GET /api/customers', () => {
  const text = summarizeToolResult(JSON.stringify({
    ok: true,
    count: 4,
    recordType: 'patient',
    q: '',
    filter: ['age:gte:60'],
  }));
  assert.match(text, /4 records/);
  assert.match(text, /age:gte:60/);
});
