(function(){
  'use strict';

  var form=document.getElementById('bookingForm');
  var status=document.getElementById('formMessage');
  var submit=document.getElementById('submitBtn');
  var dateInput=document.getElementById('eventDate');

  // Das Erscheinungsbild und sämtliche Meldungen bleiben ausschließlich deutsch.
  document.documentElement.lang='de';
  var today=new Date();
  function asLocalDate(date){
    return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  dateInput.min=asLocalDate(today);
  var lastAllowed=new Date(today);
  lastAllowed.setFullYear(lastAllowed.getFullYear()+2);
  dateInput.max=asLocalDate(lastAllowed);
  document.getElementById('year').textContent=String(today.getFullYear());

  var videoButton=document.getElementById('playVideo');
  videoButton.addEventListener('click',function(){
    if(document.querySelector('.video-frame'))return;
    var frame=document.createElement('iframe');
    frame.className='video-frame';
    frame.title='Musikvideo von DJ Sami auf YouTube';
    frame.src='https://www.youtube-nocookie.com/embed/xqcRJnUggy4?autoplay=1&rel=0';
    frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
    frame.setAttribute('allowfullscreen','');
    frame.referrerPolicy='strict-origin-when-cross-origin';
    videoButton.closest('.video-inner').appendChild(frame);
  });

  function showStatus(message,kind,withLink){
    status.replaceChildren();
    status.append(document.createTextNode(message));
    if(withLink){
      status.append(document.createTextNode(' '));
      var a=document.createElement('a');
      a.href='https://www.instagram.com/djsami21/';
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.textContent='Auf Instagram kontaktieren';
      status.append(a);
    }
    status.className='form-message '+kind;
    status.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  form.addEventListener('submit',async function(event){
    event.preventDefault();
    if(!form.reportValidity()||!form.elements.privacy.checked||form.elements.eventDate.value<dateInput.min){
      showStatus('Bitte fülle alle Pflichtfelder aus und wähle ein gültiges Datum.','error');
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
      language:'de'
    };
    submit.disabled=true;
    var label=submit.querySelector('span');
    label.textContent='Anfrage wird gesendet …';
    status.replaceChildren();
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
        showStatus('Vielen Dank! Deine Anfrage wurde übermittelt. Der Termin ist erst nach einer Bestätigung reserviert.','success');
      }else if(response.status===503){
        showStatus('Die Online-Anfrage ist noch nicht freigeschaltet.','error',true);
      }else if(response.status===429){
        showStatus('Es wurden zu viele Anfragen gesendet. Bitte versuche es später erneut.','error');
      }else{
        showStatus('Das hat leider nicht geklappt. Bitte versuche es erneut.','error');
      }
    }catch(_error){
      showStatus('Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.','error');
    }finally{
      submit.disabled=false;
      label.textContent='Anfrage senden';
    }
  });
})();