const message = document.querySelector('#admin-message');
const list = document.querySelector('#appointments-list');
const hoursList = document.querySelector('#hours-list');
const servicesList = document.querySelector('#services-list');
const blocksList = document.querySelector('#blocks-list');
const rangeFrom = document.querySelector('#range-from');
const rangeTo = document.querySelector('#range-to');
let state;

function tell(text, success = false) {
  message.textContent = text;
  message.classList.toggle('success', success);
}

async function api(url, options) {
  if (window.LOVE_PETS_DEMO_API) return window.LOVE_PETS_DEMO_API(url, options);
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar a agenda.');
  return data;
}

function apiWrite(url, method, body) {
  return api(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

function dayOffset(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

const statusLabels = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function renderSummary() {
  const active = state.appointments.filter(item => item.date >= state.today);
  document.querySelector('#count-pending').textContent = active.filter(item => item.status === 'pending').length;
  document.querySelector('#count-confirmed').textContent = active.filter(item => item.status === 'confirmed').length;
  document.querySelector('#count-upcoming').textContent = active.filter(item => !['cancelled', 'completed'].includes(item.status)).length;
}

function renderAppointments() {
  list.replaceChildren();
  if (!state.appointments.length) {
    const empty = document.createElement('div'); empty.className = 'empty-agenda'; empty.textContent = 'Nenhuma solicitação neste período.'; list.append(empty); return;
  }
  const labels = Object.fromEntries(state.services.map(item => [item.id, item.label]));
  for (const item of state.appointments) {
    const card = document.createElement('article'); card.className = 'appointment-card';
    const when = document.createElement('div'); when.className = 'appointment-date';
    const time = document.createElement('strong'); time.textContent = item.time;
    const date = document.createElement('span'); date.textContent = dateLabel(item.date);
    when.append(time, date);
    const pet = document.createElement('div'); pet.className = 'appointment-pet';
    const petName = document.createElement('strong'); petName.textContent = `${item.pet_name} · ${item.pet_type === 'gato' ? 'gato' : 'cão'}`;
    const service = document.createElement('span'); service.textContent = `${labels[item.service] || item.service} · ${item.duration_minutes} min`;
    pet.append(petName, service);
    const person = document.createElement('div'); person.className = 'appointment-person';
    const guardian = document.createElement('strong'); guardian.textContent = item.guardian_name;
    const contact = document.createElement('span');
    const phone = document.createElement('a'); phone.href = `https://wa.me/55${item.phone}`; phone.target = '_blank'; phone.rel = 'noopener'; phone.textContent = item.phone;
    if (window.LOVE_PETS_DEMO_API) contact.textContent = 'Contato fictício · demonstração';
    else contact.append(phone);
    person.append(guardian, contact);
    if (item.taxydog) { const transport = document.createElement('span'); transport.className = 'appointment-transport'; transport.textContent = `Taxidog · Buscar e levar: ${item.pickup_address || 'Endereço não informado'}`; person.append(transport); }
    if (item.notes) { const note = document.createElement('span'); note.textContent = item.notes; person.append(note); }
    const actions = document.createElement('div'); actions.className = 'appointment-actions';
    const pill = document.createElement('span'); pill.className = `status-pill ${item.status}`; pill.textContent = statusLabels[item.status] || item.status;
    const select = document.createElement('select'); select.setAttribute('aria-label', `Alterar status de ${item.pet_name}`);
    for (const [value, label] of Object.entries(statusLabels)) { const option = document.createElement('option'); option.value = value; option.textContent = label; select.append(option); }
    select.value = item.status;
    select.addEventListener('change', async () => {
      const next = select.value;
      if (next === 'cancelled' && !confirm(`Cancelar o horário de ${item.pet_name} em ${dateLabel(item.date)} às ${item.time}?`)) { select.value = item.status; return; }
      select.disabled = true;
      try { await apiWrite(`/api/admin/appointments/${item.id}`, 'PATCH', { status: next }); tell('Agendamento atualizado.', true); await loadState(); }
      catch (error) { select.value = item.status; tell(error.message); select.disabled = false; }
    });
    actions.append(pill, select); card.append(when, pet, person, actions); list.append(card);
  }
}

function renderHours() {
  hoursList.replaceChildren();
  state.hours.forEach(day => {
    const row = document.createElement('div'); row.className = 'hours-row'; row.dataset.weekday = day.weekday;
    const label = document.createElement('label');
    const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.name = 'enabled'; enabled.checked = day.enabled;
    label.append(enabled, document.createTextNode(dayNames[day.weekday]));
    const open = document.createElement('input'); open.type = 'time'; open.name = 'openTime'; open.step = '1800'; open.value = day.openTime; open.setAttribute('aria-label', `Abertura de ${dayNames[day.weekday]}`);
    const close = document.createElement('input'); close.type = 'time'; close.name = 'closeTime'; close.step = '1800'; close.value = day.closeTime; close.setAttribute('aria-label', `Encerramento de ${dayNames[day.weekday]}`);
    const updateDisabled = () => { open.disabled = close.disabled = !enabled.checked; };
    enabled.addEventListener('change', updateDisabled); updateDisabled(); row.append(label, open, close); hoursList.append(row);
  });
}

function renderServices() {
  servicesList.replaceChildren();
  state.services.filter(service => service.id !== 'tosa').forEach(service => {
    const row = document.createElement('div'); row.className = 'service-row'; row.dataset.id = service.id; row.dataset.label = service.label;
    row.dataset.enabled = String(service.enabled);
    const label = document.createElement('span'); label.className = 'service-name'; label.textContent = service.label;
    if (!service.enabled) { const note = document.createElement('small'); note.textContent = 'Indisponível'; label.append(note); }
    const duration = document.createElement('select'); duration.name = 'durationMinutes'; duration.setAttribute('aria-label', `Duração de ${service.label}`);
    for (let minute = 30; minute <= 240; minute += 30) { const option = document.createElement('option'); option.value = minute; option.textContent = `${minute} min`; duration.append(option); }
    duration.value = String(service.durationMinutes); row.append(label, duration); servicesList.append(row);
  });
}

function renderBlocks() {
  blocksList.replaceChildren();
  if (!state.blocks.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Nenhum período bloqueado no intervalo exibido.'; blocksList.append(p); return; }
  for (const block of state.blocks) {
    const row = document.createElement('div'); row.className = 'block-item';
    const label = document.createElement('div'); const strong = document.createElement('strong'); strong.textContent = `${dateLabel(block.date)} · ${block.time === '*' ? 'dia inteiro' : block.time}`;
    label.append(strong); if (block.reason) { const reason = document.createElement('span'); reason.textContent = ` · ${block.reason}`; label.append(reason); }
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remover'; remove.setAttribute('aria-label', `Remover bloqueio de ${dateLabel(block.date)} ${block.time}`);
    remove.addEventListener('click', async () => { remove.disabled = true; try { await api(`/api/admin/blocks/${block.id}`, { method: 'DELETE' }); tell('Bloqueio removido.', true); await loadState(); } catch (error) { tell(error.message); remove.disabled = false; } });
    row.append(label, remove); blocksList.append(row);
  }
}

async function loadState() {
  const localToday = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (!rangeFrom.value || rangeFrom.value < localToday) rangeFrom.value = localToday;
  if (!rangeTo.value || rangeTo.value < localToday) rangeTo.value = dayOffset(localToday, 45);
  const params = new URLSearchParams();
  if (rangeFrom.value) params.set('from', rangeFrom.value);
  if (rangeTo.value) params.set('to', rangeTo.value);
  state = await api(`/api/admin/state?${params}`);
  if (!rangeFrom.value || rangeFrom.value < state.today) rangeFrom.value = state.today;
  if (!rangeTo.value) rangeTo.value = dayOffset(state.today, 45);
  document.querySelector('#block-form [name=date]').min = state.today;
  renderSummary(); renderAppointments(); renderHours(); renderServices(); renderBlocks();
}

document.querySelector('#refresh-agenda').addEventListener('click', () => { tell(''); loadState().catch(error => tell(error.message)); });

document.querySelector('#hours-form').addEventListener('submit', async event => {
  event.preventDefault();
  const hours = [...hoursList.querySelectorAll('.hours-row')].map(row => ({ weekday: Number(row.dataset.weekday), enabled: row.querySelector('[name=enabled]').checked, openTime: row.querySelector('[name=openTime]').value, closeTime: row.querySelector('[name=closeTime]').value }));
  try { await apiWrite('/api/admin/hours', 'PUT', { hours }); tell('Horários da semana salvos.', true); await loadState(); }
  catch (error) { tell(error.message); }
});
let hoursSaveTimer;
hoursList.addEventListener('change', () => {
  clearTimeout(hoursSaveTimer);
  hoursSaveTimer = setTimeout(() => document.querySelector('#hours-form').requestSubmit(), 450);
});

document.querySelector('#services-form').addEventListener('submit', async event => {
  event.preventDefault();
  const services = state.services.map(service => {
    const row = [...servicesList.querySelectorAll('.service-row')].find(item => item.dataset.id === service.id);
    return row ? { id: row.dataset.id, label: row.dataset.label, enabled: row.dataset.enabled === 'true', durationMinutes: Number(row.querySelector('[name=durationMinutes]').value) } : { ...service, enabled: false };
  });
  try { await apiWrite('/api/admin/services', 'PUT', { services }); tell('Duração dos serviços salva.', true); await loadState(); }
  catch (error) { tell(error.message); }
});

const blockTime = document.querySelector('#block-form [name=time]');
for (let hour = 7; hour < 22; hour++) for (const minute of ['00', '30']) { const option = document.createElement('option'); option.value = `${String(hour).padStart(2, '0')}:${minute}`; option.textContent = option.value; blockTime.append(option); }

document.querySelector('#block-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try { await apiWrite('/api/admin/blocks', 'POST', data); tell('Período bloqueado.', true); form.reset(); await loadState(); }
  catch (error) { tell(error.message); }
});

document.querySelector('#copy-calendar')?.addEventListener('click', async () => {
  try {
    const data = await api('/api/admin/calendar-url');
    if (data.calendarText) {
      const url = URL.createObjectURL(new Blob([data.calendarText], {type:'text/calendar;charset=utf-8'}));
      const download = document.createElement('a'); download.href=url; download.download='love-pets-demonstracao.ics'; download.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      tell('Calendário de demonstração baixado. Contém os registros compartilhados da Love Pets.',true); return;
    }
    await navigator.clipboard.writeText(data.url);
    tell('Link iCal copiado. Cole-o em “Adicionar calendário por URL” no Google Calendar ou Outlook.', true);
  } catch (error) { tell(error.message || 'Não foi possível copiar o link.'); }
});

loadState().catch(error => { tell(error.message); list.textContent = 'A agenda está temporariamente indisponível.'; });
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadState().catch(error => tell(error.message)); });
setInterval(() => {
  const localToday = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (state && state.today !== localToday) loadState().catch(error => tell(error.message));
}, 60000);
