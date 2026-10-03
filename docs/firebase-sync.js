(function () {
  const projectId = 'mundix';
  const apiKey = 'AIzaSyCZxFIpb91Dy_Y3uDeb0SyA3DLJ4jhkk9w';
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  function encodeValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) };
    if (typeof value === 'number') return { doubleValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
    if (typeof value === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)])) } };
    return { stringValue: String(value) };
  }

  function decodeValue(value) {
    if (!value) return null;
    if ('nullValue' in value) return null;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('stringValue' in value) return value.stringValue;
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
    if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)]));
    return null;
  }

  function fromDocument(document) {
    const id = document.name?.split('/').pop();
    return { id, ...Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, decodeValue(value)])) };
  }

  async function request(url, options = {}) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${apiKey}`, { cache: 'no-store', ...options });
    if (!response.ok) throw new Error(`Firebase request failed (${response.status})`);
    return response.status === 204 ? null : response.json();
  }

  async function list(collection) {
    const data = await request(`${base}/${collection}`);
    return (data.documents || []).map(fromDocument);
  }

  async function get(collection, id) {
    try { return fromDocument(await request(`${base}/${collection}/${encodeURIComponent(id)}`)); } catch { return null; }
  }

  async function save(collection, id, data) {
    const existing = await get(collection, id);
    const merged = { ...(existing || {}), ...data, id: undefined };
    delete merged.id;
    await request(`${base}/${collection}/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields: Object.fromEntries(Object.entries(merged).map(([key, value]) => [key, encodeValue(value)])) }),
    });
    return { id, ...merged };
  }

  async function remove(collection, id) {
    await request(`${base}/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  window.LovePetsFirebase = {
    listProducts: () => list('lovePetsProducts'),
    saveProduct: (id, data) => save('lovePetsProducts', id, data),
    deleteProduct: id => remove('lovePetsProducts', id),
    saveAppointment: (id, data) => save('lovePetsAppointments', id, data),
    listAppointments: () => list('lovePetsAppointments'),
  };
})();
