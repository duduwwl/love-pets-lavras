// Shared fictional agenda for the GitHub Pages demonstration. It never calls the live API.
(() => {
 if (!window.LOVE_PETS_DEMO_MODE) return;
 const key = 'love-pets-demo-v2';
 const currentDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
 let today = currentDay();
 const addDay = days => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
 const sample = () => ({
  today,
  services: [{ id: 'banho', label: 'Banho', durationMinutes: 60, enabled: true }, { id: 'banho-tosa', label: 'Banho e tosa', durationMinutes: 120, enabled: true }],
  hours: Array.from({ length: 7 }, (_, weekday) => ({ weekday, enabled: weekday >= 2, openTime: '12:00', closeTime: '18:00' })),
  appointments: [
   { id: 'demo-1', date: addDay(1), time: '12:00', pet_name: 'Luna', pet_type: 'gato', guardian_name: 'Cliente exemplo 1', service: 'banho', duration_minutes: 60, status: 'pending', notes: 'Exemplo fictício' },
   { id: 'demo-2', date: addDay(1), time: '14:00', pet_name: 'Theo', pet_type: 'cao', guardian_name: 'Cliente exemplo 2', service: 'banho-tosa', duration_minutes: 120, status: 'confirmed', notes: 'Exemplo fictício' },
   { id: 'demo-3', date: addDay(2), time: '13:00', pet_name: 'Mel', pet_type: 'cao', guardian_name: 'Cliente exemplo 3', service: 'banho', duration_minutes: 60, status: 'pending', notes: 'Exemplo fictício' },
  ],
  blocks: [],
 });
 let data;
 try { const stored = JSON.parse(localStorage.getItem(key)); data = stored?.today === today && Array.isArray(stored.appointments) ? stored : sample(); } catch { data = sample(); }
 const save = () => { try { localStorage.setItem(key, JSON.stringify(data)); } catch { throw new Error('O navegador não permitiu salvar os exemplos. Ative o armazenamento local para testar alterações.'); } };
 const min = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
 const timeOf = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
 const validTime = time => /^(?:[01]\d|2[01]):(?:00|30)$/.test(time);
 const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date);
 const active = item => !['cancelled', 'completed'].includes(item.status);
 const overlaps = (a, b) => a.date === b.date && min(a.time) < min(b.time) + b.duration_minutes && min(b.time) < min(a.time) + a.duration_minutes;
 const blocked = (appointment, block) => appointment.date === block.date && (block.time === '*' || overlaps(appointment, { ...block, duration_minutes: 30 }));
 const weekday = date => new Date(`${date}T12:00:00Z`).getUTCDay();
 const scheduleFor = date => data.hours.find(item => item.weekday === weekday(date));
 const serviceFor = id => data.services.find(item => item.id === id && item.enabled);
 const nowTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
 const availability = (date, serviceId) => {
  const service = serviceFor(serviceId), schedule = scheduleFor(date);
  if (!validDate(date) || date < today || date > addDay(45) || !service || !schedule?.enabled) return { date, service: serviceId, slots: [] };
  const slots = [];
  for (let start = min(schedule.openTime); start + service.durationMinutes <= min(schedule.closeTime); start += 30) {
   const time = timeOf(start);
   if (date === today && time <= nowTime()) continue;
   const candidate = { date, time, duration_minutes: service.durationMinutes };
   if (!data.appointments.some(item => active(item) && overlaps(candidate, item)) && !data.blocks.some(block => blocked(candidate, block))) slots.push(time);
  }
  return { date, service: serviceId, durationMinutes: service.durationMinutes, slots, dayUnavailable: slots.length === 0 };
 };
 const esc = value => String(value).replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
 const stamp = (date, time) => date.replaceAll('-', '') + 'T' + time.replace(':', '') + '00';
 const calendarText = items => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Love Pets//Demo//PT-BR', 'CALSCALE:GREGORIAN', ...items.filter(active).map(item => {
  const end = min(item.time) + item.duration_minutes;
  return ['BEGIN:VEVENT', `UID:${item.id}@love-pets-demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, `DTSTART;TZID=America/Sao_Paulo:${stamp(item.date, item.time)}`, `DTEND;TZID=America/Sao_Paulo:${stamp(item.date, `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`)}`, `SUMMARY:${esc('DEMONSTRAÇÃO · ' + item.pet_name)}`, 'DESCRIPTION:Dados fictícios. Não é uma reserva real.', 'END:VEVENT'].join('\r\n'); }), 'END:VCALENDAR'].join('\r\n') + '\r\n';
 const jsonBody = options => options?.body ? JSON.parse(options.body) : {};

 window.LOVE_PETS_DEMO_API = async (path, options = {}) => {
  if (currentDay() !== today) { today = currentDay(); data = sample(); save(); }
  const url = new URL(path, location.origin), method = options.method || 'GET', body = jsonBody(options);
  if (url.pathname === '/api/config' && method === 'GET') return { services: data.services.filter(item => item.enabled), today, maxDate: addDay(45), timezone: 'America/Sao_Paulo' };
  if (url.pathname === '/api/availability' && method === 'GET') return availability(url.searchParams.get('date'), url.searchParams.get('service'));
  if (url.pathname === '/api/appointments' && method === 'POST') {
   const service = serviceFor(body.service), slots = availability(body.date, body.service).slots;
   const phone = String(body.phone || '').replace(/\D/g, '');
   if (!service || !slots.includes(body.time) || !body.petName || !body.guardianName || !['cao', 'gato'].includes(body.petType) || !['10', '11'].includes(String(phone.length))) throw new Error('Esse horário não está mais disponível. Escolha outro.');
   if (body.taxydog && String(body.pickupAddress || '').trim().length < 10) throw new Error('Informe o endereço completo para o Taxidog.');
   const id = `demo-${crypto.randomUUID()}`;
   data.appointments.push({ id, date: body.date, time: body.time, service: body.service, duration_minutes: service.durationMinutes, pet_name: String(body.petName).slice(0, 80), pet_type: body.petType, guardian_name: String(body.guardianName).slice(0, 100), phone, email: String(body.email || '').slice(0, 120), notes: String(body.notes || '').slice(0, 500), taxydog: body.taxydog ? 1 : 0, pickup_address: body.taxydog ? String(body.pickupAddress || '').slice(0, 240) : null, status: 'pending' });
   save(); return { id, date: body.date, time: body.time, status: 'pending', calendarUrl: `/api/appointments/${id}.ics` };
  }
  const visitorIcs = url.pathname.match(/^\/api\/appointments\/(demo-[\w-]+)\.ics$/);
  if (visitorIcs && method === 'GET') {
   const item = data.appointments.find(appointment => appointment.id === visitorIcs[1] && active(appointment));
   if (!item) throw new Error('Agendamento não encontrado.');
   return { calendarText: calendarText([item]) };
  }
  if (url.pathname === '/api/admin/state' && method === 'GET') {
   const from = url.searchParams.get('from') || addDay(-7), to = url.searchParams.get('to') || addDay(45);
   if (from > to) throw new Error('A data inicial deve vir antes da data final.');
   return structuredClone({ ...data, appointments: data.appointments.filter(item => item.date >= from && item.date <= to).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), blocks: data.blocks.filter(item => item.date >= from && item.date <= to) });
  }
  const appointmentMatch = url.pathname.match(/^\/api\/admin\/appointments\/(demo-[\w-]+)$/);
  if (appointmentMatch && method === 'PATCH') {
   const item = data.appointments.find(appointment => appointment.id === appointmentMatch[1]);
   if (!item || !['pending', 'confirmed', 'completed', 'cancelled'].includes(body.status)) throw new Error('Alteração inválida.');
   if (['pending', 'confirmed'].includes(body.status) && (data.blocks.some(block => blocked(item, block)) || data.appointments.some(other => other.id !== item.id && active(other) && overlaps(other, item)))) throw new Error('Este período está ocupado ou bloqueado.');
   item.status = body.status; save(); return { ok: true };
  }
  if (url.pathname === '/api/admin/hours' && method === 'PUT') {
   if (!Array.isArray(body.hours) || body.hours.length !== 7 || body.hours.some(item => !Number.isInteger(item.weekday) || item.weekday < 0 || item.weekday > 6 || !validTime(item.openTime) || !validTime(item.closeTime) || (item.enabled && min(item.openTime) >= min(item.closeTime)))) throw new Error('Confira os horários de abertura e encerramento.');
   data.hours = body.hours; save(); return { ok: true };
  }
  if (url.pathname === '/api/admin/services' && method === 'PUT') {
   if (!Array.isArray(body.services) || body.services.length !== data.services.length || body.services.some(item => !data.services.some(saved => saved.id === item.id) || !Number.isInteger(item.durationMinutes) || item.durationMinutes < 30 || item.durationMinutes > 240 || item.durationMinutes % 30)) throw new Error('Confira a duração dos serviços.');
   data.services = body.services; save(); return { ok: true };
  }
  if (url.pathname === '/api/admin/blocks' && method === 'POST') {
   if (!validDate(body.date) || body.date < today || (body.time !== '*' && !validTime(body.time))) throw new Error('Escolha uma data e um horário válidos.');
   const block = { id: crypto.randomUUID(), date: body.date, time: body.time, reason: String(body.reason || '').slice(0, 100) };
   if (data.appointments.some(item => active(item) && blocked(item, block))) throw new Error('Cancele a reserva do exemplo antes de bloquear este período.');
   if (data.blocks.some(item => item.date === block.date && (item.time === '*' || block.time === '*' || item.time === block.time))) throw new Error('Este período já está bloqueado.');
   data.blocks.push(block); save(); return { ok: true };
  }
  if (url.pathname.startsWith('/api/admin/blocks/') && method === 'DELETE') { data.blocks = data.blocks.filter(item => item.id !== url.pathname.split('/').pop()); save(); return { ok: true }; }
  if (url.pathname === '/api/admin/calendar-url' && method === 'GET') return { calendarText: calendarText(data.appointments) };
  throw new Error('Ação indisponível na demonstração.');
 };
 document.querySelector('#reset-demo')?.addEventListener('click', () => { data = sample(); save(); location.reload(); });
})();
