(function () {
  'use strict';
  var language = localStorage.getItem('djSamiLanguage') === 'de' ? 'de' : 'en';
  var translations = {
    en: {
      nav_music:'Music',nav_about:'About',nav_booking:'Bookings',book_now:'BOOK SAMI',
      hero_kicker:'FRANKFURT / MALLORCA / EVERYWHERE',
      hero_desc:'DJ sets that move people. Music that stays with you long after the night is over.',
      hero_book:'REQUEST A BOOKING',explore_music:'EXPLORE THE MUSIC',
      music_title_1:'LOUDER THAN',music_title_2:'WORDS.',
      music_desc:'Discover the latest release, watch the energy unfold, and follow the music wherever you listen.',
      latest_release:'LATEST RELEASE',listen_release:'LISTEN TO THE LATEST TRACK',
      watch_video:'WATCH THE MUSIC VIDEO',follow_moments:'FOLLOW THE MOMENTS',discover_more:'DISCOVER MORE MUSIC',
      about_title_1:'BUILT FOR',about_title_2:'THE MOMENT.',
      about_desc:"From Frankfurt to Mallorca, DJ Sami brings the music, the connection and the feeling of a night you won't forget.",
      about_quote:"IT'S NOT JUST THE MUSIC. IT'S <em>HOW IT FEELS.</em>",
      about_long:'Club nights, private celebrations, festivals and unforgettable events. Every performance is about creating a real connection with the crowd.',
      lets_make_it:"LET'S MAKE IT HAPPEN",play_video:'PLAY VIDEO',
      booking_title_1:'YOUR EVENT.',booking_title_2:'MY SOUND.',
      booking_desc:"Tell us a little about your event. Send a request and we'll get back to you about availability and the details. This is an enquiry, not a confirmed booking.",
      booking_tip:'Clubs, private events, festivals, brand experiences and more.',
      form_title:"LET'S TALK ABOUT YOUR EVENT",
      field_name:'YOUR NAME *',field_email:'EMAIL ADDRESS *',field_type:'EVENT TYPE *',choose_type:'Select event type',
      field_date:'EVENT DATE *',field_city:'CITY / VENUE *',field_guests:'EXPECTED GUESTS',field_message:'ANYTHING ELSE?',
      privacy_consent:'I agree that my details will be used to respond to this booking enquiry. See the <a href="/privacy.html">privacy notice</a>.',
      send_request:'SEND BOOKING REQUEST',form_note:'No payment and no automatic booking confirmation.',
      footer_line:'GOOD MUSIC. GOOD PEOPLE. GREAT NIGHTS.',imprint:'IMPRINT',privacy:'PRIVACY',
      sending:'SENDING…',success:"Your enquiry has been sent! We'll be in touch. Please note that the date is not reserved until confirmed.",
      unavailable:'Online booking requests are not available yet. Please contact DJ Sami through <a href="https://www.instagram.com/djsami21/" target="_blank" rel="noopener noreferrer">Instagram</a> in the meantime.',
      failure:'Something went wrong. Please try again in a moment.',invalid:'Please complete the required fields and choose a future event date.',
      types:['Club / Nightlife','Festival','Private event','Corporate / Brand','Other'],
      placeholders:['Your full name','you@example.com','Frankfurt, Germany','e.g. 250','Tell us about your event, timing, venue and any special requests...']
    },
    de: {
      nav_music:'Musik',nav_about:'Über Sami',nav_booking:'Booking',book_now:'SAMI ANFRAGEN',
      hero_kicker:'FRANKFURT / MALLORCA / ÜBERALL',
      hero_desc:'DJ Sets, die Menschen bewegen. Musik, die noch lange nach der Nacht bleibt.',
      hero_book:'BOOKING ANFRAGEN',explore_music:'MUSIK ENTDECKEN',
      music_title_1:'LAUTER ALS',music_title_2:'WORTE.',
      music_desc:'Entdecke den neuesten Release, erlebe die Energie und folge der Musik auf deinen Lieblingsplattformen.',
      latest_release:'NEUER RELEASE',listen_release:'JETZT DEN NEUEN TRACK HÖREN',
      watch_video:'MUSIKVIDEO ANSEHEN',follow_moments:'MOMENTE MITERLEBEN',discover_more:'MEHR MUSIK ENTDECKEN',
      about_title_1:'GEMACHT FÜR',about_title_2:'DEN MOMENT.',
      about_desc:'Von Frankfurt bis Mallorca bringt DJ Sami Musik, Nähe zum Publikum und unvergessliche Nächte zusammen.',
      about_quote:'ES IST NICHT NUR DIE MUSIK. ES IST <em>DAS GEFÜHL.</em>',
      about_long:'Clubnächte, private Feiern, Festivals und besondere Events. Bei jedem Auftritt zählt die Verbindung zum Publikum.',
      lets_make_it:'JETZT EVENT PLANEN',play_video:'VIDEO ABSPIELEN',
      booking_title_1:'DEIN EVENT.',booking_title_2:'MEIN SOUND.',
      booking_desc:'Erzähl uns kurz von deinem Event. Nach deiner Anfrage melden wir uns mit Informationen zur Verfügbarkeit und den nächsten Schritten. Es handelt sich noch nicht um eine verbindliche Buchung.',
      booking_tip:'Clubs, private Feiern, Festivals, Firmenevents und mehr.',
      form_title:'ERZÄHL UNS VON DEINEM EVENT',
      field_name:'DEIN NAME *',field_email:'E MAIL ADRESSE *',field_type:'ART DES EVENTS *',choose_type:'Event auswählen',
      field_date:'EVENTDATUM *',field_city:'STADT / LOCATION *',field_guests:'ERWARTETE GÄSTE',field_message:'WEITERE INFOS?',
      privacy_consent:'Ich bin damit einverstanden, dass meine Angaben zur Bearbeitung meiner Buchungsanfrage verwendet werden. Mehr dazu in der <a href="/privacy.html">Datenschutzerklärung</a>.',
      send_request:'BOOKING ANFRAGEN',form_note:'Keine Zahlung und keine automatische Buchungsbestätigung.',
      footer_line:'GUTE MUSIK. GUTE MENSCHEN. GROSSARTIGE NÄCHTE.',imprint:'IMPRESSUM',privacy:'DATENSCHUTZ',
      sending:'WIRD GESENDET…',success:'Deine Anfrage wurde gesendet! Wir melden uns bei dir. Der Termin ist erst nach Bestätigung reserviert.',
      unavailable:'Onlineanfragen sind momentan noch nicht freigeschaltet. Kontaktiere DJ Sami in der Zwischenzeit über <a href="https://www.instagram.com/djsami21/" target="_blank" rel="noopener noreferrer">Instagram</a>.',
      failure:'Etwas ist schiefgelaufen. Bitte versuche es gleich noch einmal.',invalid:'Bitte fülle die Pflichtfelder aus und wähle ein zukünftiges Datum.',
      types:['Club / Nachtleben','Festival','Private Feier','Firma / Marke','Sonstiges'],
      placeholders:['Vorname und Nachname','du@beispiel.de','Frankfurt, Deutschland','z. B. 250','Erzähl uns von deinem Event, Uhrzeit, Location und besonderen Wünschen...']
    }
  };
  var toggle = document.getElementById('localeToggle');
  var form = document.getElementById('bookingForm');
  var status = document.getElementById('formMessage');
  var submit = document.getElementById('submitBtn');
  var dateInput = document.getElementById('eventDate');
  var currentDate = new Date();
  var localNow = new Date(currentDate.getTime() - currentDate.getTimezoneOffset()*60000);
  dateInput.min = localNow.toISOString().slice(0,10);
  dateInput.max = String(currentDate.getFullYear()+2) + '-12-31';
  function setLanguage(lang) {
    language = lang;
    localStorage.setItem('djSamiLanguage',lang);
    document.documentElement.lang = lang;
    var dict = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(function(element){
      var key = element.getAttribute('data-i18n');
      if (!dict[key]) return;
      if (key === 'privacy_consent' || key === 'about_quote') element.innerHTML = dict[key];
      else element.textContent = dict[key];
    });
    toggle.textContent = lang === 'en' ? 'DE' : 'EN';
    toggle.setAttribute('aria-label',lang === 'en' ? 'Deutsch auswählen' : 'Switch to English');
    var types = form.elements.eventType.options;
    for (var i=1; i<types.length; i++) types[i].textContent = dict.types[i-1];
    var placeholders = [form.elements.name,form.elements.email,form.elements.location,form.elements.guestCount,form.elements.message];
    placeholders.forEach(function(el,i){el.placeholder = dict.placeholders[i]});
    if (status.dataset.kind !== 'success' && status.dataset.kind !== 'error') status.textContent = '';
  }
  setLanguage(language);
  toggle.addEventListener('click',function(){setLanguage(language === 'en' ? 'de':'en')});
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('playVideo').addEventListener('click',function(){
    var frame = document.createElement('iframe');
    frame.className='video-frame';
    frame.title='DJ Sami music video on YouTube';
    frame.src='https://www.youtube-nocookie.com/embed/xqcRJnUggy4?autoplay=1&rel=0';
    frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
    frame.setAttribute('allowfullscreen','');
    frame.referrerPolicy='strict-origin-when-cross-origin';
    this.closest('.video-inner').appendChild(frame);
  });
  function showStatus(message,kind) {
    status.innerHTML = message;
    status.className = 'form-message '+kind;
    status.dataset.kind = kind;
    status.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  form.addEventListener('submit',async function(event){
    event.preventDefault();
    if (!form.reportValidity() || !form.elements.privacy.checked || form.elements.eventDate.value < dateInput.min) {
      showStatus(translations[language].invalid,'error');
      return;
    }
    var data = {
      name:form.elements.name.value.trim(),
      email:form.elements.email.value.trim(),
      eventType:form.elements.eventType.value,
      eventDate:form.elements.eventDate.value,
      location:form.elements.location.value.trim(),
      guestCount:form.elements.guestCount.value ? Number(form.elements.guestCount.value) : null,
      message:form.elements.message.value.trim(),
      website:form.elements.website.value,
      privacy:form.elements.privacy.checked,
      language:language
    };
    submit.disabled=true;
    submit.querySelector('[data-i18n="send_request"]').textContent=translations[language].sending;
    status.textContent='';
    try {
      var response=await fetch('/api/bookings',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(data),
        credentials:'same-origin'
      });
      var result=await response.json().catch(function(){return {}});
      if(response.ok && result.ok){
        form.reset();
        showStatus(translations[language].success,'success');
      } else if(response.status===503) {
        showStatus(translations[language].unavailable,'error');
      } else {
        showStatus(result.error === 'RATE_LIMIT' ? (language==='de'?'Zu viele Anfragen. Bitte versuche es später.':'Too many requests. Please try again later.') : translations[language].failure,'error');
      }
    } catch (error) {
      showStatus(translations[language].failure,'error');
    } finally {
      submit.disabled=false;
      submit.querySelector('[data-i18n="send_request"]').textContent=translations[language].send_request;
    }
  });
})();