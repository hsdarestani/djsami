(function(){
'use strict';
var language = 'en';
try { language = localStorage.getItem('djSamiLanguage') === 'de' ? 'de' : 'en'; } catch (_e) {}
var translations={
  en:{
    nav_music:'Music',nav_about:'About',nav_booking:'Bookings',book_now:'Book DJ Sami',
    hero_kicker:'DJ / FRANKFURT / MALLORCA',hero_lead:'Your night. My sound.',
    hero_desc:'Music for nights worth remembering.',hero_book:'Request a booking',explore_music:'Listen to music',
    music_title:'Find my music.',music_desc:'Tracks, videos and moments from the booth.',
    listen_release:'Listen to the latest track',watch_video:'Watch the music video',follow_moments:'Shows and behind the scenes',discover_more:'More music',
    latest_release:'LATEST TRACK',listen_now:'Listen now',
    about_title:'Here for the music.',about_desc:'DJ Sami brings the energy from Frankfurt to Mallorca and beyond. Clubs, festivals and private events.',
    lets_make_it:'Plan an event together',video_title:'Hear the sound.',play_video:'Play video',
    booking_title:"Let's make it a night.",booking_desc:"Planning an event? Share the details and I'll get back to you about availability.",
    booking_tip:'No commitment. Just a booking enquiry.',
    form_title:'Tell me about your event',form_time:'About 1 minute',
    field_name:'Your name *',field_email:'Email *',field_date:'Date *',field_city:'City / Venue *',
    field_type:'Event type *',choose_type:'Choose an event type',more_details:'Add more details (optional)',
    field_guests:'Expected guests',field_message:'Message',
    privacy_consent:'I agree to the use of my details to respond to this request. Read the <a href="/privacy.html">privacy notice</a>.',
    send_request:'Send booking enquiry',form_note:'A request is not a confirmed booking.',
    footer_line:'See you on the dance floor.',imprint:'Imprint',privacy:'Privacy',
    back_top:'Back to top',mobile_book:'Request DJ Sami',sending:'Sending…',
    success:"Request sent! We'll be in touch. Your date is not reserved until confirmed.",
    unavailable:'Booking enquiries are not available yet. Please contact DJ Sami via <a href="https://www.instagram.com/djsami21/" target="_blank" rel="noopener noreferrer">Instagram</a>.',
    failure:'Something went wrong. Please try again.',
    invalid:'Please complete the required fields and choose a future event date.',
    too_many:'Too many requests. Please try again later.',
    types:['Club / Nightlife','Festival','Private event','Corporate / Brand','Other'],
    placeholders:['Full name','you@example.com','Frankfurt, Germany','e.g. 250','Anything we should know?']
  },
  de:{
    nav_music:'Musik',nav_about:'Über Sami',nav_booking:'Booking',book_now:'DJ Sami buchen',
    hero_kicker:'DJ / FRANKFURT / MALLORCA',hero_lead:'Dein Event. Mein Sound.',
    hero_desc:'Musik für Nächte, die bleiben.',hero_book:'Booking anfragen',explore_music:'Musik hören',
    music_title:'Meine Musik.',music_desc:'Tracks, Videos und Momente vom DJ Pult.',
    listen_release:'Aktuellen Track hören',watch_video:'Musikvideo ansehen',follow_moments:'Shows und Einblicke',discover_more:'Weitere Musik',
    latest_release:'NEUER TRACK',listen_now:'Jetzt hören',
    about_title:'Musik, die verbindet.',about_desc:'DJ Sami bringt die Energie von Frankfurt bis Mallorca. Für Clubs, Festivals und private Events.',
    lets_make_it:'Event gemeinsam planen',video_title:'Sound erleben.',play_video:'Video abspielen',
    booking_title:'Dein Event. Mein Set.',booking_desc:'Du planst ein Event? Schick die Eckdaten und ich melde mich zur Verfügbarkeit.',
    booking_tip:'Unverbindliche Anfrage, keine feste Buchung.',
    form_title:'Erzähl mir von deinem Event',form_time:'Etwa 1 Minute',
    field_name:'Dein Name *',field_email:'E Mail *',field_date:'Datum *',field_city:'Stadt / Location *',
    field_type:'Art des Events *',choose_type:'Event auswählen',more_details:'Weitere Angaben (optional)',
    field_guests:'Gästezahl',field_message:'Nachricht',
    privacy_consent:'Ich bin mit der Verarbeitung meiner Angaben zur Beantwortung meiner Anfrage einverstanden. Mehr in der <a href="/privacy.html">Datenschutzerklärung</a>.',
    send_request:'Anfrage senden',form_note:'Die Anfrage ist noch keine bestätigte Buchung.',
    footer_line:'Wir sehen uns auf der Tanzfläche.',imprint:'Impressum',privacy:'Datenschutz',
    back_top:'Nach oben',mobile_book:'DJ Sami anfragen',sending:'Wird gesendet…',
    success:'Anfrage gesendet! Wir melden uns. Dein Termin ist erst nach Bestätigung reserviert.',
    unavailable:'Bookinganfragen sind noch nicht freigeschaltet. Kontaktiere DJ Sami über <a href="https://www.instagram.com/djsami21/" target="_blank" rel="noopener noreferrer">Instagram</a>.',
    failure:'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
    invalid:'Bitte fülle alle Pflichtfelder aus und wähle ein zukünftiges Datum.',
    too_many:'Zu viele Anfragen. Bitte versuche es später erneut.',
    types:['Club / Nightlife','Festival','Private Veranstaltung','Firmenevent','Sonstiges'],
    placeholders:['Vorname und Nachname','du@beispiel.de','Frankfurt, Deutschland','z. B. 250','Weitere Infos zum Event']
  }
};
var toggle=document.getElementById('localeToggle');
var form=document.getElementById('bookingForm');
var status=document.getElementById('formMessage');
var submit=document.getElementById('submitBtn');
var dateInput=document.getElementById('eventDate');
var today=new Date(),localToday=new Date(today.getTime()-today.getTimezoneOffset()*60000);
dateInput.min=localToday.toISOString().slice(0,10);
var lastAllowed=new Date(today);lastAllowed.setFullYear(today.getFullYear()+2);
dateInput.max=new Date(lastAllowed.getTime()-lastAllowed.getTimezoneOffset()*60000).toISOString().slice(0,10);
function setLanguage(lang){
  language=lang;
  try{localStorage.setItem('djSamiLanguage',lang)}catch(_e){}
  document.documentElement.lang=lang;
  var dict=translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(function(element){
    var key=element.getAttribute('data-i18n');
    if(!(key in dict))return;
    if(key==='privacy_consent'){element.innerHTML=dict[key]}else element.textContent=dict[key];
  });
  toggle.textContent=lang==='en'?'DE':'EN';
  toggle.setAttribute('aria-label',lang==='en'?'Deutsch auswählen':'Switch to English');
  var opts=form.elements.eventType.options;
  for(var i=1;i<opts.length;i++)opts[i].textContent=dict.types[i-1];
  [form.elements.name,form.elements.email,form.elements.location,form.elements.guestCount,form.elements.message]
   .forEach(function(input,i){input.placeholder=dict.placeholders[i]});
}
setLanguage(language);
toggle.addEventListener('click',function(){setLanguage(language==='en'?'de':'en')});
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('playVideo').addEventListener('click',function(){
  var frame=document.createElement('iframe');
  frame.className='video-frame';
  frame.title='DJ Sami music video on YouTube';
  frame.src='https://www.youtube-nocookie.com/embed/xqcRJnUggy4?autoplay=1&rel=0';
  frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
  frame.setAttribute('allowfullscreen','');
  frame.referrerPolicy='strict-origin-when-cross-origin';
  this.closest('.video-inner').appendChild(frame);
});
function showStatus(message,kind){
  status.innerHTML=message; // Only fixed, locally authored translation strings.
  status.className='form-message '+kind;
  status.scrollIntoView({behavior:'smooth',block:'nearest'});
}
form.addEventListener('submit',async function(event){
  event.preventDefault();
  if(!form.reportValidity() || !form.elements.privacy.checked || form.elements.eventDate.value<dateInput.min){
    showStatus(translations[language].invalid,'error');
    return;
  }
  var data={
    name:form.elements.name.value.trim(),
    email:form.elements.email.value.trim(),
    eventDate:form.elements.eventDate.value,
    location:form.elements.location.value.trim(),
    eventType:form.elements.eventType.value,
    guestCount:form.elements.guestCount.value?Number(form.elements.guestCount.value):null,
    message:form.elements.message.value.trim(),
    website:form.elements.website.value,
    privacy:form.elements.privacy.checked,
    language:language
  };
  submit.disabled=true;
  submit.querySelector('[data-i18n="send_request"]').textContent=translations[language].sending;
  status.textContent='';
  try{
    var response=await fetch('/api/bookings',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data),
      credentials:'same-origin'
    });
    var result=await response.json().catch(function(){return {}});
    if(response.ok&&result.ok){
      form.reset();
      document.getElementById('moreDetails').open=false;
      showStatus(translations[language].success,'success');
    }else if(response.status===503){
      showStatus(translations[language].unavailable,'error');
    }else if(response.status===429){
      showStatus(translations[language].too_many,'error');
    }else{
      showStatus(translations[language].failure,'error');
    }
  }catch(_error){
    showStatus(translations[language].failure,'error');
  }finally{
    submit.disabled=false;
    submit.querySelector('[data-i18n="send_request"]').textContent=translations[language].send_request;
  }
});
})();