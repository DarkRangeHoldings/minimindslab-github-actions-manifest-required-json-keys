import { appendFileSync } from 'node:fs';

const payloadRaw = process.env.INPUT_PAYLOAD;
const outputPath = process.env.GITHUB_OUTPUT;

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

if (typeof payloadRaw !== 'string') fail('INPUT_PAYLOAD must be a JSON string.');
if (typeof outputPath !== 'string' || outputPath.length === 0) fail('GITHUB_OUTPUT must be a non-empty string path.');

let payload;
try {
  payload = JSON.parse(payloadRaw);
} catch {
  fail('INPUT_PAYLOAD must be valid JSON.');
}

if (!isPlainObject(payload)) fail('Payload must be an object.');

if (!Object.prototype.hasOwnProperty.call(payload, 'value')) fail('Payload must contain value.');
if (!Object.prototype.hasOwnProperty.call(payload, 'required')) fail('Payload must contain required.');

const { value, required } = payload;

if (!isPlainObject(value)) fail('value must be a plain object.');
if (!Array.isArray(required)) fail('required must be an array.');

const requiredSet = new Set();
for (let i = 0; i < required.length; i += 1) {
  const key = required[i];
  if (typeof key !== 'string' || key.length === 0) fail('required must contain only non-empty strings.');
  if (requiredSet.has(key)) fail('required must contain unique strings.');
  requiredSet.add(key);
}

const present = [];
const missing = [];
for (const key of requiredSet) {
  if (Object.prototype.hasOwnProperty.call(value, key)) present.push(key);
  else missing.push(key);
}

present.sort();
missing.sort();

const result = {
  missing,
  ok: missing.length === 0,
  present
};

appendFileSync(outputPath, `result=${JSON.stringify(result)}\n`);