const form = document.querySelector('#booking-form');
const servicesElement = document.querySelector('#service-options');
const dateElement = document.querySelector('#date');
const timesElement = document.querySelector('#time-options');
const slotStatus = document.querySelector('#slot-status');
const formMessage = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type=submit]');
const taxydogOption = document.querySelector('#taxydog-option');
const taxydogAddress = document.querySelector('#taxydog-address');
const pickupAddress = document.querySelector('#pickup-address');
let services = [];
let selectedTime = '';
let requestMode = false;
let loadingTimes = 0;

function syncTaxidog() {
  taxydogAddress.hidden = !taxydogOption.checked;
  pickupAddress.required = taxydogOption.checked;
  pickupAddress.disabled = !taxydogOption.checked;
  if (!taxydogOption.checked) pickupAddress.value = '';
}
taxydogOption.addEventListener('change', syncTaxidog);
if (location.hash === '#taxydog') taxydogOption.checked = true;
syncTaxidog();

function durationText(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}h` : ''}${rest ? String(rest).padStart(2, '0') : ''}` || `${minutes} min`;
}

function showMessage(message, good = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('success', good);
}

async function api(url, options) {
  if (window.LOVE_PETS_DEMO_API) return window.LOVE_PETS_DEMO_API(url, options);
  const response = await fetch(`${window.LOVE_PETS_API_ORIGIN || ''}${url}`, { credentials: 'same-origin', signal: AbortSignal.timeout(10000), ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'A agenda está indisponível no momento.');
  return data;
}

function selectedService() { return form.querySelector('input[name=service]:checked')?.value || ''; }

function renderServices() {
  servicesElement.replaceChildren();
  services.forEach((service, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'service'; input.value = service.id; input.required = true; input.checked = index === 0;
    input.addEventListener('change', loadTimes);
    const span = document.createElement('span');
    span.append(document.createTextNode(service.label));
    const small = document.createElement('small');
    small.textContent = `${requestMode ? 'Duração estimada' : 'Reserva'} de ${durationText(service.durationMinutes)}`;
    span.append(small); label.append(input, span); servicesElement.append(label);
  });
}

async function loadTimes({ preserveSelection = false } = {}) {
  if (requestMode) return;
  const attempt = ++loadingTimes;
  const previousTime = preserveSelection ? selectedTime : '';
  selectedTime = '';
  timesElement.replaceChildren();
  if (!dateElement.value || !selectedService()) { slotStatus.textContent = 'Selecione uma data para ver os horários.'; return; }
  slotStatus.textContent = 'Buscando horários livres...';
  try {
    const data = await api(`/api/availability?date=${encodeURIComponent(dateElement.value)}&service=${encodeURIComponent(selectedService())}`);
    if (attempt !== loadingTimes) return;
    if (!data.slots.length) { slotStatus.textContent = data.dayUnavailable ? 'Dia indisponível: todos os horários já estão ocupados. Experimente outra data.' : 'Sem horários livres neste dia. Experimente outra data.'; return; }
    slotStatus.textContent = `${data.slots.length} ${data.slots.length === 1 ? 'horário disponível' : 'horários disponíveis'} · toque para escolher`;
    data.slots.forEach(time => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'time'; input.value = time;
      if (time === previousTime) { input.checked = true; selectedTime = time; }
      input.addEventListener('change', () => { selectedTime = time; showMessage(''); });
      const span = document.createElement('span'); span.textContent = time;
      label.append(input, span); timesElement.append(label);
    });
  } catch (error) { if (attempt === loadingTimes) { slotStatus.textContent = error.message; enableRequestMode(); } }
}

function enableRequestMode() {
  if (requestMode) return;
  requestMode = true;
  loadingTimes++;
  if (!services.length) services = [{id:'banho',label:'Banho',durationMinutes:60},{id:'banho-tosa',label:'Banho e tosa',durationMinutes:120}];
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const maximum = new Date(`${today}T12:00:00Z`); maximum.setUTCDate(maximum.getUTCDate()+45);
  dateElement.min = today; dateElement.max = maximum.toISOString().slice(0,10);
  const notice = document.createElement('p');
  notice.className = 'availability-notice'; notice.setAttribute('role','status');
  notice.textContent = 'A consulta automática de horários está temporariamente indisponível. Informe sua preferência e envie o pedido pelo WhatsApp. A equipe confirma a disponibilidade antes de reservar.';
  form.prepend(notice);
  document.querySelector('.booking-intro > p').textContent = 'Escolha o cuidado e indique o dia e o horário que prefere. Envie seu pedido pelo WhatsApp para a equipe confirmar a disponibilidade.';
  document.querySelector('.card-head > p').textContent = 'Seu horário será combinado com a equipe pelo WhatsApp.';
  document.querySelector('.intro-notice div span').textContent = 'Atendemos cães e gatos em Lavras. A equipe combina os detalhes do cuidado com você.';
  document.querySelector('.form-footnote').textContent = 'O formulário prepara uma mensagem. O pedido só é enviado quando você confirmar no WhatsApp; a equipe confirma o horário.';
  slotStatus.textContent = 'Qual horário você prefere? A disponibilidade será confirmada pela equipe.';
  timesElement.setAttribute('aria-label','Preferência de horário');
  timesElement.replaceChildren();
  const label = document.createElement('label'); label.className = 'preferred-time';
  label.textContent = 'Horário de preferência';
  const input = document.createElement('input'); input.type = 'time'; input.name = 'time'; input.step = '1800'; input.required = true;
  input.addEventListener('input', () => { selectedTime = input.value; });
  label.append(input); timesElement.append(label);
  submitButton.textContent = 'Preparar pedido pelo WhatsApp'; submitButton.disabled = false;
  renderServices();
}

function prepareWhatsAppRequest(payload) {
  const service = services.find(item => item.id === payload.service);
  const dateLabel = new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeZone:'UTC'}).format(new Date(`${payload.date}T12:00:00Z`));
  const message = ['Olá, Love Pets! Gostaria de pedir um horário.','',`Serviço: ${service.label}`,`Pet: ${payload.petName} (${payload.petType === 'gato' ? 'gato' : 'cão'})`,`Tutor: ${payload.guardianName}`,`WhatsApp: ${payload.phone}`,`Preferência: ${dateLabel}, às ${payload.time}`,payload.taxydog ? 'Taxidog: quero buscar e levar meu pet em casa' : '',payload.taxydog ? `Endereço: ${payload.pickupAddress}` : '',payload.email ? `E-mail: ${payload.email}` : '',payload.notes ? `Observações: ${payload.notes}` : '', '', 'Podem confirmar a disponibilidade e, se solicitado, os detalhes do Taxidog?'].filter(Boolean).join('\n');
  const success = document.querySelector('#booking-success');
  success.querySelector('h2').textContent = 'Pedido pronto para enviar';
  success.querySelector('.success-icon').textContent = '♡';
  document.querySelector('#success-detail').textContent = `${payload.petName}: ${service.label}, ${dateLabel}, às ${payload.time}.`;
  document.querySelector('#success-detail').nextElementSibling.textContent = 'Nenhuma reserva foi salva ou enviada ainda. Abra o WhatsApp, confira a mensagem e envie. A equipe confirma se o horário está disponível.';
  document.querySelector('#calendar-download').hidden = true;
  let link = document.querySelector('#whatsapp-request');
  if (!link) {
    link = document.createElement('a'); link.id = 'whatsapp-request'; link.className = 'submit-booking'; link.target = '_blank'; link.rel = 'noopener';
    success.querySelector('.success-actions').prepend(link);
  }
  link.textContent = 'Enviar pedido pelo WhatsApp'; link.href = `https://wa.me/5535999146809?text=${encodeURIComponent(message)}`;
  form.hidden = true; success.hidden = false; success.scrollIntoView({block:'start'});
}

dateElement.addEventListener('change', loadTimes);
document.addEventListener('visibilitychange', () => { if (!document.hidden && dateElement.value && !form.hidden) loadTimes({ preserveSelection: true }); });
setInterval(() => { if (!document.hidden && dateElement.value && !form.hidden) loadTimes({ preserveSelection: true }); }, 30000);

form.addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  if (!form.reportValidity()) return;
  if (!selectedTime) { showMessage(requestMode ? 'Informe o horário de preferência.' : 'Escolha um dos horários disponíveis.'); timesElement.scrollIntoView({ block: 'center' }); return; }
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.time = selectedTime;
  payload.taxydog = taxydogOption.checked;
  payload.pickupAddress = taxydogOption.checked ? pickupAddress.value.trim() : '';
  if (![10, 11].includes(String(payload.phone || '').replace(/\D/g, '').length)) { showMessage('Confira o WhatsApp com DDD.'); return; }
  if (requestMode) { prepareWhatsAppRequest(payload); return; }
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando solicitação';
  try {
    const booking = await api('/api/appointments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    form.hidden = true;
    document.querySelector('#booking-success').hidden = false;
    const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${booking.date}T12:00:00Z`));
    document.querySelector('#success-detail').textContent = `${payload.petName}: ${dateLabel}, às ${booking.time}.${payload.taxydog ? ' Taxidog solicitado.' : ''}`;
    if (payload.taxydog) document.querySelector('#success-detail').nextElementSibling.textContent = 'A solicitação de banho e Taxidog foi recebida. A equipe confirma o horário, o transporte e o valor pelo WhatsApp.';
    const calendarLink = document.querySelector('#calendar-download');
    calendarLink.addEventListener('click', async event => {
      event.preventDefault();
      try {
        const calendar = window.LOVE_PETS_DEMO_API
          ? await window.LOVE_PETS_DEMO_API(booking.calendarUrl)
          : await (async () => { const response = await fetch(`${window.LOVE_PETS_API_ORIGIN || ''}${booking.calendarUrl}`, { signal: AbortSignal.timeout(10000) }); if (!response.ok) throw new Error('Não foi possível baixar o calendário.'); return { blob: await response.blob() }; })();
        const url = URL.createObjectURL(calendar.blob || new Blob([calendar.calendarText], { type: 'text/calendar;charset=utf-8' }));
        const download = document.createElement('a'); download.href = url; download.download = 'love-pets-agendamento.ics'; download.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { document.querySelector('#success-detail').textContent += ' O calendário está indisponível no momento.'; }
    });
    document.querySelector('#booking-success').scrollIntoView({ block: 'start' });
  } catch (error) {
    showMessage(error.message);
    if (/horário/i.test(error.message)) loadTimes();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Solicitar horário';
  }
});

api('/api/config').then(config => {
  services = config.services.filter(service => service.enabled !== false && service.id !== 'tosa');
  if (!services.length) throw new Error('Nenhum serviço está disponível para agendamento agora.');
  dateElement.min = config.today;
  dateElement.max = config.maxDate;
  renderServices();
  if (dateElement.value) loadTimes();
}).catch(enableRequestMode);
