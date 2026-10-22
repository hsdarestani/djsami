(function(){
'use strict';

document.documentElement.lang='de';
const form=document.getElementById('bookingForm');
const status=document.getElementById('formMessage');
const submit=document.getElementById('submitBtn');
const dateInput=document.getElementById('eventDate');
const bookingDetails=document.getElementById('bookingDetails');
const moreDetails=document.getElementById('moreDetails');

const now=new Date();
function localDate(date){
  return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
dateInput.min=localDate(now);
const lastAllowed=new Date(now);
lastAllowed.setFullYear(lastAllowed.getFullYear()+2);
dateInput.max=localDate(lastAllowed);

// German display in all browsers (including iPhones), ISO format for D1.
const datePicker=typeof window.flatpickr==='function'
  ?window.flatpickr(dateInput,{
    locale:'de',
    dateFormat:'Y-m-d',
    altInput:true,
    altFormat:'d.m.Y',
    ariaDateFormat:'l, j. F Y',
    allowInput:true,
    disableMobile:true,
    minDate:dateInput.min,
    maxDate:dateInput.max,
    monthSelectorType:'dropdown',
    onReady:function(_dates,_value,instance){
      instance.altInput.placeholder='TT.MM.JJJJ';
      instance.altInput.setAttribute('aria-label','Veranstaltungsdatum im Format TT.MM.JJJJ');
      instance.altInput.setAttribute('autocomplete','off');
      instance.altInput.setAttribute('lang','de-DE');
    }
  })
  :null;

function validBookingDate(){
  if(!datePicker)return Boolean(dateInput.value) && dateInput.value>=dateInput.min && dateInput.value<=dateInput.max;
  const shown=datePicker.altInput.value.trim();
  if(!/^\\d{2}\\.\\d{2}\\.\\d{4}$/.test(shown))return false;
  const parsed=datePicker.parseDate(shown,'d.m.Y');
  if(!parsed || Number.isNaN(parsed.getTime()) || datePicker.formatDate(parsed,'d.m.Y')!==shown)return false;
  const iso=datePicker.formatDate(parsed,'Y-m-d');
  if(iso<dateInput.min||iso>dateInput.max)return false;
  datePicker.setDate(parsed,false);
  return dateInput.value===iso;
}
document.getElementById('year').textContent=String(now.getFullYear());

// A booking request should be accessible in one tap, without sending users
// through extra pages or exposing a large form until it is needed.
function openBooking(){
  bookingDetails.open=true;
}
document.querySelectorAll('a[href="#booking"]').forEach(function(link){
  link.addEventListener('click',openBooking);
});
window.addEventListener('hashchange',function(){
  if(window.location.hash==='#booking')openBooking();
});
if(window.location.hash==='#booking')openBooking();

function showStatus(message,kind,instagram){
  status.replaceChildren(document.createTextNode(message));
  if(instagram){
    status.append(document.createTextNode(' '));
    const link=document.createElement('a');
    link.href='https://www.instagram.com/djsami21/';
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent='Auf Instagram kontaktieren';
    status.append(link);
  }
  status.className='form-message '+kind;
  status.scrollIntoView({behavior:'smooth',block:'nearest'});
}
form.addEventListener('submit',async function(event){
  event.preventDefault();
  if(!form.reportValidity()||!form.elements.privacy.checked||!validBookingDate()){
    showStatus('Bitte fülle die Pflichtfelder aus und wähle ein gültiges Datum.','error');
    return;
  }
  const data={
    name:form.elements.name.value.trim(),
    email:form.elements.email.value.trim(),
    eventDate:form.elements.eventDate.value,
    location:form.elements.location.value.trim(),
    eventType:form.elements.eventType.value,
    guestCount:form.elements.guestCount.value?Number(form.elements.guestCount.value):null,
    message:form.elements.message.value.trim(),
    website:form.elements.website.value,
    privacy:form.elements.privacy.checked,
    language:'de'
  };
  submit.disabled=true;
  const label=submit.querySelector('span');
  label.textContent='Anfrage wird gesendet …';
  status.replaceChildren();
  try{
    const response=await fetch('/api/bookings',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data),
      credentials:'same-origin'
    });
    const result=await response.json().catch(function(){return {}});
    if(response.ok&&result.ok){
      form.reset();
      if(datePicker)datePicker.clear();
      moreDetails.open=false;
      bookingDetails.open=true;
      showStatus('Vielen Dank! Deine Anfrage wurde übermittelt. Der Termin ist erst nach einer Bestätigung reserviert.','success');
    }else if(response.status===503){
      showStatus('Die Online-Anfrage ist noch nicht freigeschaltet.','error',true);
    }else if(response.status===429){
      showStatus('Es wurden zu viele Anfragen gesendet. Bitte versuche es später erneut.','error');
    }else{
      showStatus('Die Anfrage konnte nicht gespeichert werden. Bitte versuche es erneut.','error');
    }
  }catch(_error){
    showStatus('Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.','error');
  }finally{
    submit.disabled=false;
    label.textContent='Anfrage senden';
  }
});
})();
