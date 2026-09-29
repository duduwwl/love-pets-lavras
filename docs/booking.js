const form = document.querySelector('#booking-form');
const servicesElement = document.querySelector('#service-options');
const dateElement = document.querySelector('#date');
const timesElement = document.querySelector('#time-options');
const slotStatus = document.querySelector('#slot-status');
const formMessage = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type=submit]');
let services = [];
let selectedTime = '';

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
  const response = await fetch(`${window.LOVE_PETS_API_ORIGIN || ''}${url}`, { credentials: 'same-origin', ...options });
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
    small.textContent = `Reserva de ${durationText(service.durationMinutes)}`;
    span.append(small); label.append(input, span); servicesElement.append(label);
  });
}

async function loadTimes() {
  selectedTime = '';
  timesElement.replaceChildren();
  if (!dateElement.value || !selectedService()) { slotStatus.textContent = 'Selecione uma data para ver os horários.'; return; }
  slotStatus.textContent = 'Buscando horários livres...';
  try {
    const data = await api(`/api/availability?date=${encodeURIComponent(dateElement.value)}&service=${encodeURIComponent(selectedService())}`);
    if (!data.slots.length) { slotStatus.textContent = 'Sem horários livres neste dia. Experimente outra data.'; return; }
    slotStatus.textContent = `${data.slots.length} ${data.slots.length === 1 ? 'horário disponível' : 'horários disponíveis'} · toque para escolher`;
    data.slots.forEach(time => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'time'; input.value = time;
      input.addEventListener('change', () => { selectedTime = time; showMessage(''); });
      const span = document.createElement('span'); span.textContent = time;
      label.append(input, span); timesElement.append(label);
    });
  } catch (error) { slotStatus.textContent = error.message; }
}

dateElement.addEventListener('change', loadTimes);

form.addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  if (!form.reportValidity()) return;
  if (!selectedTime) { showMessage('Escolha um dos horários disponíveis.'); timesElement.scrollIntoView({ block: 'center' }); return; }
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.time = selectedTime;
  if (![10, 11].includes(String(payload.phone || '').replace(/\D/g, '').length)) { showMessage('Confira o WhatsApp com DDD.'); return; }
  submitButton.disabled = true;
  submitButton.firstChild.textContent = 'Enviando solicitação '; 
  try {
    const booking = await api('/api/appointments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    form.hidden = true;
    document.querySelector('#booking-success').hidden = false;
    const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${booking.date}T12:00:00Z`));
    document.querySelector('#success-detail').textContent = `${payload.petName}: ${dateLabel}, às ${booking.time}.`;
    document.querySelector('#calendar-download').href = `${window.LOVE_PETS_API_ORIGIN || ''}${booking.calendarUrl}`;
    document.querySelector('#booking-success').scrollIntoView({ block: 'start' });
  } catch (error) {
    showMessage(error.message);
    if (/horário/i.test(error.message)) loadTimes();
  } finally {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = 'Solicitar horário ';
  }
});

api('/api/config').then(config => {
  services = config.services;
  if (!services.length) throw new Error('Nenhum serviço está disponível para agendamento agora.');
  dateElement.min = config.today;
  dateElement.max = config.maxDate;
  renderServices();
  if (dateElement.value) loadTimes();
}).catch(error => {
  servicesElement.textContent = error.message;
  slotStatus.textContent = 'Fale com a Love Pets pelo WhatsApp para escolher seu horário.';
  submitButton.disabled = true;
});
