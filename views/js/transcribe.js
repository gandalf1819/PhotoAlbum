try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
  }
  catch(e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
  }
  
  
  var noteTextarea = $('#note-textarea');
  var instructions = $('#recording-instructions');
  var notesList = $('ul#notes');
  
  var noteContent = '';
  
  // Get all notes from previous sessions and display them
  var notes = getAllNotes();
  renderNotes(notes);
  
  // Voice Recognition - AWS Transcribe       
  
  // False - the recording will stop after a few seconds of silence
  // True - Keep recording (silence period - 15 seconds)
  recognition.continuous = true;
  
  // Will be called for each line on transcribe
  recognition.onresult = function(event) {
  
    // Get current line
    var current = event.resultIndex;
  
    // Transcription of current line
    var transcript = event.results[current][0].transcript;
  
    // Add the current transcript (voice note) to the contents of the Note
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
  
    if(!mobileRepeatBug) {
      noteContent += transcript;
      noteTextarea.val(noteContent);
    }
  };
  
  recognition.onstart = function() { 
    instructions.text('Transcribe activated, try speaking into the microphone');
  }
  
  recognition.onspeechend = function() {
    instructions.text('You have been quite for a while now!');
  }
  
  recognition.onerror = function(event) {
    if(event.error == 'no-speech') {
      instructions.text('No speech detected!');  
    };
  }
  
  $('#start-btn').on('click', function(e) {
    if (noteContent.length) {
      noteContent += ' ';
    }
    recognition.start();
  });
  
  
  $('#pause-btn').on('click', function(e) {
    recognition.stop();
    instructions.text('Voice recognition paused');
  });
  
  // Sync the text inside the text area with the noteContent variable
  noteTextarea.on('input', function() {
    noteContent = $(this).val();
  })
  
  $('#save-note-btn').on('click', function(e) {
    recognition.stop();
  
    if(!noteContent.length) {
      instructions.text('Could not save empty note. Please add a message to your note.');
    }
    else {
      // Save note to localStorage
      // The key is the dateTime with seconds, the value is the content of the note
      saveNote(new Date().toLocaleString(), noteContent);
  
      // Reset variables and update UI
      noteContent = '';
      renderNotes(getAllNotes());
      noteTextarea.val('');
      instructions.text('Note saved successfully');
    }
        
  })
  
  
  notesList.on('click', function(e) {
    e.preventDefault();
    var target = $(e.target);
  
    // Listen to the selected note
    if(target.hasClass('listen-note')) {
      var content = target.closest('.note').find('.content').text();
      readOutLoud(content);
    }
  
    // Delete note
    if(target.hasClass('delete-note')) {
      var dateTime = target.siblings('.date').text();  
      deleteNote(dateTime);
      target.closest('.note').remove();
    }
  });
  
  function readOutLoud(message) {
      var speech = new SpeechSynthesisUtterance();
  
      // Set the text and voice attributes.
      speech.text = message;
      speech.volume = 1;
      speech.rate = 1;
      speech.pitch = 1;
    
      window.speechSynthesis.speak(speech);
  }
  
  function renderNotes(notes) {
    var html = '';
    if(notes.length) {
      notes.forEach(function(note) {
        html+= `<li class="note">
          <p class="header">
            <span class="date">${note.date}</span>
            <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
            <a href="#" class="delete-note" title="Delete">Delete</a>
          </p>
          <p class="content">${note.content}</p>
        </li>`;    
      });
    }
    else {
      html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
    }
    notesList.html(html);
  }
  
  
  function saveNote(dateTime, content) {
    localStorage.setItem('note-' + dateTime, content);
  }
  
  
  function getAllNotes() {
    var notes = [];
    var key;
    for (var i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i);
  
      if(key.substring(0,5) == 'note-') {
        notes.push({
          date: key.replace('note-',''),
          content: localStorage.getItem(localStorage.key(i))
        });
      } 
    }
    return notes;
  }
  
  
  function deleteNote(dateTime) {
    localStorage.removeItem('note-' + dateTime); 
  }