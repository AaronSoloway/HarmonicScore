// the processor function is responsible for taking a parsed midi file, an intonation function and 
// returning an array of notes with the following properties:
// {
//   startTime   // time in beats that the note starts
//   endTime     // time in beats that the note ends
//   complexNote // an array of partials
// }
//
// each partial has the following structure:
// {
//   frequency  // frequency of this partial in Hz
//   beats      // array of beats
// }
//
// each beat has the following structure:
// {
//   startTime  // start time of beat in MIDI beats
//   endTime    // end time of beat in MIDI beats
//   frequency  // beating frequency in Hz
//   prominence // how prominent this beat is from 0-1
// }

define(['beats'], function(GetBeat){
  
  /////////////////////////
  // Constants
  /////////////////////////
  var numHarmonics = 10;

  /////////////////////////
  // Utility Functions
  /////////////////////////

  // given a note number an an intonation function, give a list of harmonics
  var CalculateHarmonics = function(note, intonation){
    // takes a MIDI note number and outputs its frequency
    note.complexNote = [];
    note.complexNote[0] = {'frequency':intonation(note.noteMIDINum).frequency, 'beats':[]};

    for (var i = 1; i < numHarmonics; i++) {
      note.complexNote[i] = {'frequency':(i+1)*note.complexNote[0].frequency, 'beats':[]};
    }
  };

  // This checks to see if the passed-in note beats against
  // any currently-sounding notes, and returns a list of new
  // beats.
  var CheckForNewBeats = function(note, currentNotes){
    var newBeats = [];
    for(var i = 0; i < currentNotes.length; ++i){
      var otherNote = currentNotes[i];
      for(var j = 0; j < otherNote.complexNote.length; ++j){
      for(var k = 0; k < note.complexNote.length; ++k){
        var f1 = otherNote.complexNote[j];
        var f2 = note.complexNote[k];
        var beat = GetBeat(f1.frequency, f2.frequency);
        if(beat){
          // add it to the note's list of beats
          f2.beats.push({
            'baseFreq': f2,
            'other': f1,
            'frequency': beat.frequency,
            'prominence': beat.prominence,
            'startTime': note.startTime
          });

          newBeats.push({
            'f1': f1,
            'f2': f2
          });
        }
      }}
    }
    return newBeats;
  };

  // Checks if the current note ends any currently
  // ringing beats.  Returns a list of beats that
  // are ringing after this note ends.
  var CheckForBeatsEnd = function(note, currentBeats){
    for(var i = 0; i < note.complexNote.length; ++i){
      var overtone = note.complexNote[i];

      // end all of the note's overtones
      for(var j = 0; j < overtone.beats.length; ++j){
        if(!overtone.beats[j].endTime)
          overtone.beats[j].endTime = note.endTime;
      }

      // check if this overtone has any current beats, and if so,
      // then end those.
      for(j = 0; j < currentBeats.length; ++j){
        var currBeat = currentBeats[j];
        if(currBeat.f1 === note){
          for(var k = 0; k < currBeat.f2.beats.length; ++k){
            if(overtone === currBeat.f2.beats[k].other)
              currBeat.f2.beats[k].endTime = note.endTime;
          }
        }
        if(currBeat.f2 === note){
          for(k = 0; k < currBeat.f1.beats.length; ++k){
            if(overtone === currBeat.f1.beats[k].other)
              currBeat.f1.beats[k].endTime = note.endTime;
          }
        }
      }

      // now remove any beat from the list of active beats
      // that contains this as an overtone,
      var oldBeats = currentBeats;
      currentBeats = [];
      for(j = 0; j < oldBeats.length; ++j){
        if((oldBeats[j].f1 !== overtone) &&
           (oldBeats[j].f2 !== overtone))
          currentBeats.push(oldBeats[j]);
      }
    }
    return currentBeats;
  };



  /////////////////////////
  // main processing function
  /////////////////////////

  // "midi" must be a parsed standard midi file
  // "intonation" must be a function that takes note number to frequency in Hz
  // the return value of this function is an array of processed notes as describe above.
  return function(data, intonation){

    // first step:
    // Run through whole file converting from event delta times to
    // absolute time.
    var time = 0;
    for(var i = 0; i < data.length; ++i){
      time += data[i][0].beatsToEvent;
      data[i][0].event.time = time;
    }

    var currentNotes = [];
    var currentBeats = [];

    var processedNotes = [];

    // so, the next step is to loop through the events, keeping track of what is currently playing, fill out the harmonics and beats.

    // this will get called for each note on
    var doNoteOn = function(event){
      var note = {
        noteMIDINum: event.noteNumber,
        channel: event.channel,
        startTime: event.time
      };

      // calculate harmonics
      CalculateHarmonics(note, intonation);

      // Check if this note causes any new beats
      currentBeats.concat(CheckForNewBeats(note, currentNotes));

      // add it to the list of current notes
      currentNotes.push(note);
    }
    
    // this will get called for each note off
    var doNoteOff = function(event){
      // helper function that checks if a note refers to the same note as the event.
      var filter = function(note){
        return (note.channel === event.channel) && (note.noteMIDINum === event.noteNumber);
      }

      for(var i = 0; i < currentNotes.length; ++i)
      {
        var note = currentNotes[i];
        if (filter(note)) {
          // set the note's endTime to the note off time
          note.endTime = event.time;

          // check if this note ends any beats
          currentBeats = CheckForBeatsEnd(note, currentBeats);

          // add this to our list of processed notes
          processedNotes.push(note);
        }
      }

      // finally, delete the note from the list of currently playing notes.
      var oldNotes = currentNotes;
      currentNotes = [];
      for(var j = 0; j < oldNotes.length; ++j) {
        if(!filter(oldNotes[j])){
          currentNotes.push(oldNotes[j]);
        }
      }
    }

    // this just dispatches each event to the appropriate function above
    var handleEvent = function(event){
      if (event.type !== 'channel') {
          return;
      }

      switch(event.subtype){
        case 'noteOn':
          doNoteOn(event);
          break;

        case 'noteOff':
          doNoteOff(event);
          break;
      }
    };
    
    // Run through each event and "handle it"
    for(i = 0; i < data.length; ++i){
      handleEvent(data[i][0].event);
    }
    
    // okay, we're done!
    return processedNotes;
  }

});
