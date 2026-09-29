// This public demo contains fictional examples only. It never calls the live API.
(() => {
 const key='love-pets-demo-v2';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const addDay=(days)=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
 const sample=()=>({
  today,
  services:[{id:'banho',label:'Banho',durationMinutes:60,enabled:true},{id:'banho-tosa',label:'Banho e tosa',durationMinutes:120,enabled:true}],
  hours:Array.from({length:7},(_,weekday)=>({weekday,enabled:weekday>=2,openTime:'12:00',closeTime:'18:00'})),
  appointments:[
   {id:'demo-1',date:addDay(1),time:'12:00',pet_name:'Luna',pet_type:'gato',guardian_name:'Cliente exemplo 1',service:'banho',duration_minutes:60,status:'pending',notes:'Exemplo fictício'},
   {id:'demo-2',date:addDay(1),time:'14:00',pet_name:'Theo',pet_type:'cao',guardian_name:'Cliente exemplo 2',service:'banho-tosa',duration_minutes:120,status:'confirmed',notes:'Exemplo fictício'},
   {id:'demo-3',date:addDay(2),time:'13:00',pet_name:'Mel',pet_type:'cao',guardian_name:'Cliente exemplo 3',service:'banho',duration_minutes:60,status:'pending',notes:'Exemplo fictício'}
  ],blocks:[]
 });
 let data;
 try{const stored=JSON.parse(localStorage.getItem(key));data=stored?.today===today&&Array.isArray(stored.appointments)?stored:sample();}catch{data=sample();}
 function save(){try{localStorage.setItem(key,JSON.stringify(data));}catch{throw new Error('O navegador não permitiu salvar os exemplos. Ative o armazenamento local para testar alterações.');}}
 const min=(t)=>Number(t.slice(0,2))*60+Number(t.slice(3));
 const validTime=(t)=>/^(?:[01]\d|2[01]):(?:00|30)$/.test(t);
 const overlaps=(a,b)=>a.date===b.date&&min(a.time)<min(b.time)+b.duration_minutes&&min(b.time)<min(a.time)+a.duration_minutes;
 const active=(a)=>!['cancelled','completed'].includes(a.status);
 const blocked=(a,b)=>a.date===b.date&&(b.time==='*'||overlaps(a,{...b,duration_minutes:30}));
 const esc=(s)=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
 const stamp=(date,time)=>date.replaceAll('-','')+'T'+time.replace(':','')+'00';
 window.LOVE_PETS_DEMO_API=async(path,options={})=>{
  const url=new URL(path,location.origin),method=options.method||'GET';
  const body=options.body?JSON.parse(options.body):{};
  if(url.pathname==='/api/admin/state'&&method==='GET'){
   const from=url.searchParams.get('from')||addDay(-7),to=url.searchParams.get('to')||addDay(45);
   if(from>to)throw new Error('A data inicial deve vir antes da data final.');
   return structuredClone({...data,appointments:data.appointments.filter(a=>a.date>=from&&a.date<=to).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),blocks:data.blocks.filter(b=>b.date>=from&&b.date<=to)});
  }
  const match=url.pathname.match(/^\/api\/admin\/appointments\/(demo-\d)$/);
  if(match&&method==='PATCH'){
   const item=data.appointments.find(a=>a.id===match[1]);
   if(!item||!['pending','confirmed','completed','cancelled'].includes(body.status))throw new Error('Alteração inválida.');
   if(['pending','confirmed'].includes(body.status)&&(data.blocks.some(b=>blocked(item,b))||data.appointments.some(a=>a.id!==item.id&&active(a)&&overlaps(a,item))))throw new Error('Este período está ocupado ou bloqueado.');
   item.status=body.status;save();return {ok:true};
  }
  if(url.pathname==='/api/admin/hours'&&method==='PUT'){
   if(!Array.isArray(body.hours)||body.hours.length!==7||body.hours.some(h=>!Number.isInteger(h.weekday)||h.weekday<0||h.weekday>6||!validTime(h.openTime)||!validTime(h.closeTime)||(h.enabled&&min(h.openTime)>=min(h.closeTime))))throw new Error('Confira os horários de abertura e encerramento.');
   data.hours=body.hours;save();return {ok:true};
  }
  if(url.pathname==='/api/admin/services'&&method==='PUT'){
   if(!Array.isArray(body.services)||body.services.length!==data.services.length||body.services.some(s=>!data.services.some(item=>item.id===s.id)||!Number.isInteger(s.durationMinutes)||s.durationMinutes<30||s.durationMinutes>240||s.durationMinutes%30))throw new Error('Confira a duração dos serviços.');
   data.services=body.services;save();return {ok:true};
  }
  if(url.pathname==='/api/admin/blocks'&&method==='POST'){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||body.date<today||(body.time!=='*'&&!validTime(body.time)))throw new Error('Escolha uma data e um horário válidos.');
   const b={id:crypto.randomUUID(),date:body.date,time:body.time,reason:String(body.reason||'').slice(0,100)};
   if(data.appointments.some(a=>active(a)&&blocked(a,b)))throw new Error('Cancele a reserva do exemplo antes de bloquear este período.');
   if(data.blocks.some(a=>a.date===b.date&&(a.time==='*'||b.time==='*'||a.time===b.time)))throw new Error('Este período já está bloqueado.');
   data.blocks.push(b);save();return {ok:true};
  }
  if(url.pathname.startsWith('/api/admin/blocks/')&&method==='DELETE'){
   data.blocks=data.blocks.filter(b=>b.id!==url.pathname.split('/').pop());save();return {ok:true};
  }
  if(url.pathname==='/api/admin/calendar-url'&&method==='GET'){
   const events=data.appointments.filter(active).map(a=>{const end=min(a.time)+a.duration_minutes;return ['BEGIN:VEVENT','UID:'+a.id+'@love-pets-demo','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z','DTSTART;TZID=America/Sao_Paulo:'+stamp(a.date,a.time),'DTEND;TZID=America/Sao_Paulo:'+stamp(a.date,String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0')),'SUMMARY:'+esc('DEMONSTRAÇÃO · '+a.pet_name),'DESCRIPTION:Dados fictícios. Não é uma reserva real.','END:VEVENT'].join('\r\n');});
   return {calendarText:['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Love Pets//Demo//PT-BR','CALSCALE:GREGORIAN',...events,'END:VCALENDAR'].join('\r\n')+'\r\n'};
  }
  throw new Error('Ação indisponível na demonstração.');
 };
 document.querySelector('#reset-demo')?.addEventListener('click',()=>{data=sample();save();location.reload();});
})();
