const STOP = new Set([
  'show', 'find', 'list', 'search', 'get', 'customers', 'customer', 'records', 'record',
  'people', 'person', 'with', 'in', 'the', 'a', 'an', 'of', 'for', 'me', 'all', 'every',
  'everyone', 'everything', 'who', 'whose', 'are', 'is', 'and', 'or', 'please', 'from',
  'that', 'have', 'has', 'any', 'those', 'these', 'their', 'to', 'on', 'at', 'by', 'be',
  'was', 'were', 'into', 'also', 'too', 'well', 'add', 'only', 'just',
]);

const KNOWN_OPS = new Set(['eq', 'contains', 'gt', 'gte', 'lt', 'lte']);

export function contentText(message) {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('');
}

export function operatorsFor(dataType) {
  switch (dataType) {
    case 'Text':
    case 'Multiline':
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

export function catalogFromContext(context) {
  const empty = emptyCatalog();
  if (!Array.isArray(context)) return empty;
  for (const item of context) {
    const raw = typeof item?.value === 'string' ? item.value : '';
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return normalizeCatalog(parsed);
    } catch {
      /* The next context entry may be the catalog. */
    }
  }
  return empty;
}

export function parseFilter(raw) {
  const parts = String(raw ?? '').split(':');
  if (parts.length < 2 || !parts[0].trim()) return null;
  if (parts.length >= 3 && KNOWN_OPS.has(parts[1])) {
    return { code: parts[0].trim(), op: parts[1], value: parts.slice(2).join(':').trim() };
  }
  return { code: parts[0].trim(), op: 'eq', value: parts.slice(1).join(':').trim() };
}

export function sanitizeCriteria(raw, catalog) {
  const source = catalog?.recordTypes ? catalog : emptyCatalog();
  const requestedType = String(raw?.recordType ?? '').trim();
  let recordType = '';
  if (requestedType) {
    const match = source.recordTypes.find((type) =>
      type.code.toLowerCase() === requestedType.toLowerCase()
      || type.label.toLowerCase() === requestedType.toLowerCase());
    recordType = match?.code ?? (source.recordTypes.length ? '' : requestedType);
  }

  const attrs = source.attributes.filter((attr) => !recordType || !attr.recordType || attr.recordType === recordType);
  const byCode = new Map(attrs.map((attr) => [attr.code.toLowerCase(), attr]));
  const filter = [];
  const seen = new Set();
  for (const item of raw?.filter ?? []) {
    const parsed = parseFilter(item);
    if (!parsed?.value) continue;
    const attr = byCode.get(parsed.code.toLowerCase());
    if (source.attributes.length && !attr) continue;
    const allowed = attr?.operators?.length ? attr.operators : operatorsFor(attr?.dataType);
    const op = allowed.some((itemOp) => itemOp.toLowerCase() === parsed.op) ? parsed.op : allowed[0];
    const code = attr?.code ?? parsed.code;
    const line = `${code}:${op}:${parsed.value}`;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    filter.push(line);
  }

  return {
    recordType,
    q: String(raw?.q ?? '').replace(/\s+/g, ' ').trim(),
    filter,
  };
}

export function interpretQuestion(question, catalog) {
  const source = catalog?.recordTypes ? catalog : emptyCatalog();
  const original = String(question ?? '').trim();
  const current = source.current ?? { recordType: '', q: '', filter: [] };
  if (!original) {
    return { recordType: '', q: '', filter: [] };
  }
  if (/^(hi|hello|hey|help)[.!?\s]*$/i.test(original)) {
    return {
      chatOnly: true,
      text: 'Ask for customers in plain language, for example “patients over 60” or “show everyone”. I update the grid with the same filters as a saved search.',
    };
  }
  if (isClear(original)) {
    return { recordType: '', q: '', filter: [] };
  }

  let working = ` ${original.toLowerCase()} `;
  const refine = /\b(?:also|as well|add)\b/.test(working);
  let recordType = '';
  const types = [...source.recordTypes].sort((left, right) => right.label.length - left.label.length);
  for (const type of types) {
    const codeWords = type.code.replace(/_/g, ' ');
    if (hasWord(working, type.label) || hasWord(working, codeWords) || hasWord(working, type.code)) {
      recordType = type.code;
      working = erase(working, type.label);
      working = erase(working, type.code);
      break;
    }
  }

  const scoped = source.attributes.filter((attr) => !recordType || !attr.recordType || attr.recordType === recordType);
  const filters = [];
  const age = scoped.find((attr) => isAge(attr));
  if (age && /\b(?:seniors?|elderly)\b/.test(working)) {
    filters.push(`${age.code}:gte:60`);
    working = erase(working, 'senior');
    working = erase(working, 'seniors');
    working = erase(working, 'elderly');
  }

  const numeric = scoped.filter((attr) => isRange(attr.dataType));
  for (const attr of scoped) {
    const label = attr.label.toLowerCase();
    const code = attr.code.toLowerCase().replace(/_/g, ' ');
    const mentioned = hasWord(working, label) || hasWord(working, code) || hasWord(working, attr.code);
    if (isRange(attr.dataType) && (mentioned || numeric.length === 1)) {
      const window = mentioned ? afterLabel(working, label) || afterLabel(working, code) : working;
      const between = /between\s+(\d+(?:\.\d+)?|\d{4}-\d{2}-\d{2})\s+and\s+(\d+(?:\.\d+)?|\d{4}-\d{2}-\d{2})/i.exec(window);
      if (between) {
        filters.push(`${attr.code}:gte:${between[1]}`, `${attr.code}:lte:${between[2]}`);
        working = erase(working, between[0]);
        working = erase(working, label);
        continue;
      }
      const gte = /(?:over|above|older than|greater than|more than|at least|minimum|>=)\s+(\d+(?:\.\d+)?|\d{4}-\d{2}-\d{2})/i.exec(window);
      if (gte) {
        filters.push(`${attr.code}:gte:${gte[1]}`);
        working = erase(working, gte[0]);
        working = erase(working, label);
        continue;
      }
      const lte = /(?:under|below|younger than|less than|at most|maximum|<=)\s+(\d+(?:\.\d+)?|\d{4}-\d{2}-\d{2})/i.exec(window);
      if (lte) {
        filters.push(`${attr.code}:lte:${lte[1]}`);
        working = erase(working, lte[0]);
        working = erase(working, label);
        continue;
      }
      if (mentioned) {
        const exact = new RegExp(`(?:${escapeReg(label)}|${escapeReg(code)})s?\\s*(?:is|of|=|:)?\\s*(\\d+(?:\\.\\d+)?|\\d{4}-\\d{2}-\\d{2})`, 'i').exec(working);
        if (exact) {
          filters.push(`${attr.code}:eq:${exact[1]}`);
          working = erase(working, exact[0]);
          continue;
        }
      }
    }

    if (attr.dataType === 'Boolean' && mentioned) {
      const negative = new RegExp(`(?:not|no|without|non)[-\\s]+${escapeReg(label)}s?`, 'i').test(working);
      filters.push(`${attr.code}:eq:${negative ? 'false' : 'true'}`);
      working = erase(working, label);
      continue;
    }

    if (attr.dataType === 'Dropdown') {
      pushOptions(filters, working, attr);
      for (const option of attr.options) {
        working = erase(working, option.label);
        working = erase(working, option.value);
      }
      continue;
    }

    if (isText(attr.dataType) && mentioned) {
      const pattern = new RegExp(
        `(?:${escapeReg(label)}|${escapeReg(code)})s?\\s*(?:containing|contains|is|equals|:)?\\s+(?:["']([^"']+)["']|([a-z0-9@.+_-]+))`,
        'i',
      );
      const match = pattern.exec(working);
      const value = (match?.[1] || match?.[2] || '').trim();
      if (value && !STOP.has(value.toLowerCase())) {
        const op = attr.dataType === 'Phone'
          ? (attr.operators.includes('contains') ? 'contains' : 'eq')
          : (attr.operators.includes('contains') ? 'contains' : 'eq');
        const normalized = attr.dataType === 'Phone' ? value.replace(/\D/g, '') : value;
        if (normalized) filters.push(`${attr.code}:${op}:${normalized}`);
        working = erase(working, match[0]);
      }
    }
  }

  const nameAttr = scoped.find((attr) => /name/.test(`${attr.code} ${attr.label}`.toLowerCase()) && isText(attr.dataType));
  const named = /\b(?:named|called|name is)\s+([a-z][\w.'-]*)/i.exec(original);
  if (nameAttr && named) {
    const op = nameAttr.operators.includes('contains') ? 'contains' : 'eq';
    filters.push(`${nameAttr.code}:${op}:${named[1]}`);
    working = erase(working, named[0]);
  }

  const phoneAttr = scoped.find((attr) => attr.dataType === 'Phone' || /phone|mobile/.test(attr.code + attr.label));
  const phone = /\b(\+?\d[\d\s()-]{6,}\d)\b/.exec(original);
  if (phoneAttr && phone && !filters.some((line) => line.toLowerCase().startsWith(`${phoneAttr.code.toLowerCase()}:`))) {
    const digits = phone[1].replace(/\D/g, '');
    if (digits.length >= 7) {
      const op = phoneAttr.operators.includes('contains') ? 'contains' : 'eq';
      filters.push(`${phoneAttr.code}:${op}:${digits}`);
      working = erase(working, phone[0]);
    }
  }

  for (const attr of scoped.filter((item) => item.dataType === 'Dropdown')) {
    pushOptions(filters, working, attr);
    for (const option of attr.options) working = erase(working, option.label);
  }

  if (!recordType) {
    const used = new Set();
    for (const line of filters) {
      const code = line.split(':')[0]?.toLowerCase();
      const attr = source.attributes.find((item) => item.code.toLowerCase() === code);
      if (attr?.recordType) used.add(attr.recordType);
    }
    if (used.size === 1) recordType = [...used][0];
  }

  const remainder = working
    .replace(/[^a-z0-9@.+_-]+/g, ' ')
    .split(' ')
    .filter((token) => token && !STOP.has(token) && token.length > 1);
  const q = filters.length ? '' : remainder.join(' ');
  const next = refine
    ? {
      recordType: recordType || current.recordType || '',
      q: q || current.q || '',
      filter: [...(current.filter ?? []), ...filters],
    }
    : { recordType, q, filter: filters };
  return sanitizeCriteria(next, { ...source, attributes: source.attributes });
}

export function summarizeToolResult(raw) {
  let data = {};
  try {
    data = JSON.parse(String(raw ?? ''));
  } catch {
    data = {};
  }
  if (!data || typeof data !== 'object') data = {};
  if (data.ok === false) {
    return `I couldn't apply that search. ${data.error || 'The customer search rejected those filters.'}`;
  }
  const count = Number.isFinite(Number(data.count)) ? Number(data.count) : 0;
  const bits = [];
  if (data.recordType) bits.push(String(data.recordType));
  if (data.q) bits.push(`matching “${data.q}”`);
  if (Array.isArray(data.filter) && data.filter.length) bits.push(data.filter.join(', '));
  const detail = bits.length ? ` (${bits.join('; ')})` : '';
  const noun = count === 1 ? 'record' : 'records';
  return `The customer grid is showing ${count} ${noun}${detail}.`;
}

function emptyCatalog() {
  return { recordTypes: [], attributes: [], current: { recordType: '', q: '', filter: [] } };
}

function normalizeCatalog(parsed) {
  const recordTypes = Array.isArray(parsed.recordTypes)
    ? parsed.recordTypes.filter((type) => type?.code).map((type) => ({
      code: String(type.code),
      label: String(type.label || type.code),
    }))
    : [];
  const rows = Array.isArray(parsed.attributes) ? parsed.attributes : [];
  const attributes = rows.filter((attr) => attr?.code).map((attr) => ({
    recordType: String(attr.recordType || ''),
    code: String(attr.code),
    label: String(attr.label || attr.code),
    dataType: String(attr.dataType || 'Text'),
    operators: Array.isArray(attr.operators) && attr.operators.length
      ? attr.operators.map(String)
      : operatorsFor(String(attr.dataType || 'Text')),
    options: Array.isArray(attr.options)
      ? attr.options.filter((option) => option && (option.value || option.label)).map((option) => ({
        value: String(option.value ?? option.label),
        label: String(option.label ?? option.value),
      }))
      : [],
  }));
  const current = parsed.current && typeof parsed.current === 'object'
    ? {
      recordType: String(parsed.current.recordType || ''),
      q: String(parsed.current.q || ''),
      filter: Array.isArray(parsed.current.filter) ? parsed.current.filter.map(String) : [],
    }
    : { recordType: '', q: '', filter: [] };
  return { recordTypes, attributes, current };
}

function isClear(question) {
  if (/\b(?:clear|reset)\b.*\b(?:filter|filters|search|grid)\b/i.test(question)) return true;
  return /^(?:please\s+)?(?:show|list|find|get)?\s*(?:me\s+)?(?:all|every|everyone|everything|any)(?:\s+(?:customers|records|people|rows))?[.!?\s]*$/i.test(question);
}

function isAge(attr) {
  return /age|years? old/.test(`${attr.code} ${attr.label}`.toLowerCase()) && /Integer|Decimal/.test(attr.dataType);
}

function isRange(dataType) {
  return dataType === 'Integer' || dataType === 'Decimal' || dataType === 'Date' || dataType === 'DateTime';
}

function isText(dataType) {
  return dataType === 'Text' || dataType === 'Multiline' || dataType === 'Email' || dataType === 'Phone';
}

function pushOptions(filters, working, attr) {
  for (const option of attr.options) {
    if (option.value.length < 2 && option.label.length < 2) continue;
    if (!hasWord(working, option.label) && !hasWord(working, option.value)) continue;
    filters.push(`${attr.code}:eq:${option.value}`);
  }
}

function afterLabel(text, label) {
  const index = text.toLowerCase().indexOf(String(label).toLowerCase());
  if (index < 0) return '';
  return text.slice(index, index + String(label).length + 48);
}

function hasWord(haystack, needle) {
  const token = String(needle ?? '').trim().toLowerCase();
  if (token.length < 2) return false;
  const body = escapeReg(token).replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[^a-z0-9])${body}s?(?:$|[^a-z0-9])`, 'i').test(haystack);
}

function erase(text, token) {
  const body = escapeReg(String(token).toLowerCase()).replace(/\s+/g, '\\s+');
  if (!body) return text;
  return text.replace(new RegExp(body, 'ig'), (match) => ' '.repeat(match.length));
}

function escapeReg(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
