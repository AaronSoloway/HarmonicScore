define(['mtofTable', 'freqToColor', 'beats'], function(mtof, freqToColor, GetBeat) {
  function App() {

    this.maxFrequency = 20000;
    this.maxLinFrequency = 5000;
    this.minFrequency = 20;
    this.numHarmonics = 10;
    this.pixelsPerBeat = 80;
    this.funFreqHeight = 130/this.maxFrequency; //this puts it in terms of frequency height
    this.harmFreqHeight = 50/this.maxFrequency; //this puts it in terms of frequency height

    this.funBrightness = .9; // "V" value in HSV of fundamental
    this.harmBrightness = .8;

    // display options
    this.useColor = true;
    this.logScale = true;

    // data holds unprocessed note data
    this.data = [];
    // notes holds processed note data
    this.notes = [];
    // holds the maximum time scale
    this.maxTime = 100;
    // make something up.
    this.height = 1;

    // pre-computed logs for efficiency?
    this.logMaxFreq = Math.log(this.maxFrequency);
    this.logMinFreq = Math.log(this.minFrequency);
    this.logMaxFreqMinuslogMinFreq = this.logMaxFreq - this.logMinFreq;

    this.OnLoad = function(){
      // create Raphael paper on which to draw
      this.paper = new Raphael('score');
      this.SetViewBox(this.maxTime, this.height);
      this.paper.canvas.setAttribute('height', '100%');
      this.ResizeCanvas();
      this.ClearEvents();
    };

    this.Render = function(){
      var data = this.notes;

      // set the maximum time to the last note's time.
      this.Clear();

      // draw each note
      for(var i = 0; i < data.length; ++i){
        this.DrawNote(data[i]);
      }
    }

    this.MidiChanged = function(data){
      // clear the events
      this.ClearEvents();

      // set the processed data
      this.data = data;

      // Run through whole file converting from delta times to
      // absolute time.
      var time = 0;
      for(var i = 0; i < data.length; ++i){
        time += data[i][0].beatsToEvent;
        data[i][0].event.time = time;
      }

      // process Notes
      // Run through each event and "handle it"
      for(i = 0; i < data.length; ++i){
        this.HandleEvent(data[i][0].event);
      }

      this.maxTime = this.notes[this.notes.length - 1].endTime;
      this.SetViewBox(this.maxTime, this.height);
      this.ResizeCanvas();

      this.Render();
    };

    this.ResizeCanvas = function(){
      this.paper.canvas.setAttribute('width', this.maxTime * this.pixelsPerBeat);
    };
    
    this.SetViewBox = function(w, h){
      this.paper.setViewBox(0, 0, w, h, true);
      this.paper.canvas.setAttribute('preserveAspectRatio', 'none');
      this.canvasW = w;
      this.canvasH = h;
    };

    this.ClearEvents = function(){
      this.currentNotes = [];
      this.currentBeats = [];
      this.data = [];
      this.notes = [];
      this.Clear();
    }

    this.Clear = function(){
       this.paper.clear();
      this.placemat = this.paper.rect(0,0,this.canvasW,this.canvasH).attr({"fill" : "#333333", 'stroke':'none' });
    };


    this.CheckForNewBeats = function(note){
      for(var i = 0; i < this.currentNotes.length; ++i){
        var otherNote = this.currentNotes[i];
        for(var j = 0; j < otherNote.complexNote.length; ++j){
        for(var k = 0; k < note.complexNote.length; ++k){
          var f1 = otherNote.complexNote[j];
          var f2 = note.complexNote[k];
          var beat = GetBeat(f1.frequency, f2.frequency);
          if(beat){
            // let's add the beat frequency to both the current note's harmonic
            // and the other notes.
            f1.beats.push({
              'other': f2,
              'frequency': beat.frequency,
              'prominence': beat.prominence,
              'startTime': note.startTime
            });
            f2.beats.push({
              'other': f1,
              'frequency': beat.frequency,
              'promincence': beat.prominence,
              'startTime': note.startTime
            });

            this.currentBeats.push({
              'f1': f1,
              'f2': f2
            });
          }
        }}
      }
    };

    this.CheckForBeatsEnd = function(note){
      for(var i = 0; i < note.complexNote.length; ++i){
        var overtone = note.complexNote[i];

        // end all of this notes overtones.
        for(var j = 0; j < overtone.beats.length; ++j){
          if(!overtone.beats[j].endTime)
            overtone.beats[j].endTime = note.endTime;
        }

        // check if this overtone has any current notes, and if so,
        // then end those.
        for(j = 0; j < this.currentBeats; ++j){
          var currBeat = this.currentBeats[j];
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
        // that contains this as an overtone.
        var oldBeats = this.currentBeats;
        this.currentBeats= [];
        for(j = 0; j < oldBeats.length; ++j){
          if((oldBeats[j].f1 !== overtone) &&
             (oldBeats[j].f2 !== overtone))
            this.currentBeats.push(oldBeats[j]);
        }
      }
      
    };

    this.HandleEvent = function(event){
      
      if (event.type !== 'channel') {
          return;
      }
      var filter = function(note){
        return (note.channel === event.channel) && (note.noteMIDINum === event.noteNumber);
      }
      switch(event.subtype){
        case 'noteOn':
          var note = {
            noteMIDINum: event.noteNumber,
            channel: event.channel,
            startTime: event.time
          };

          // calculate harmonics
          this.CalculateHarmonics(note);
          this.CheckForNewBeats(note);
          this.currentNotes.push(note);
          break;

        case 'noteOff':
          for(var i = 0; i < this.currentNotes.length; ++i)
          {
            var note = this.currentNotes[i];
            if (filter(note)) {
              note.endTime = event.time;
              this.CheckForBeatsEnd(note);
              this.notes.push(note);
            }
          }
          var oldNotes = this.currentNotes;
          this.currentNotes = [];
          for(var j = 0; j < oldNotes.length; ++j) {
            if(!filter(oldNotes[j])){
                this.currentNotes.push(oldNotes[j]);
            }
          }
      }
    };

    // Calculate Harmonics
    this.CalculateHarmonics = function(note){
      // takes a MIDI note number and outputs its frequency
      note.complexNote = [];
      note.complexNote[0] = {'frequency':mtof(note.noteMIDINum).frequency, 'beats':[]};

      for (var i = 1; i < this.numHarmonics; i++) {
        note.complexNote[i] = {'frequency':(i+1)*note.complexNote[0].frequency, 'beats':[]};
      }
    };

    this.freqToY = function(f, h){
      if(this.logScale)
        return 1 - (h / 2) - (Math.log(f) - this.logMinFreq) / this.logMaxFreqMinuslogMinFreq;
      else
        return 1 - (h / 2) - f/this.maxLinFrequency;
    };

    // Draws a note on the paper 
    this.DrawNote = function(note){
      var color, height;
      var complexNote = note.complexNote;
      var harmonicOpacity = 1;

      for (var i = 0; i < complexNote.length; i++) {
        if(i===0)
          height = this.funFreqHeight;
        else
          height = this.harmFreqHeight;

        if(this.useColor)
        {
          if(i!==0)
            color = freqToColor(complexNote[i].frequency, 440, this.harmBrightness);
          else
            color = freqToColor(complexNote[0].frequency, 440, this.funBrightness);
        }
        else
        {
          if(i!==0)
            color= "#f55";
          else
            color= "#f00";
        }

        this.paper.rect(note.startTime, 
                        this.freqToY(complexNote[i].frequency, height),
                        note.endTime - note.startTime, 
                        height).attr({fill: color, stroke:'none', opacity: harmonicOpacity});

        harmonicOpacity = harmonicOpacity - 0.1;
        for(var j = 0; j < complexNote[i].beats.length; ++j){
          var a = function(){
            var beat = complexNote[i].beats[j];
            console.log(beat);
            var opacity = beat.prominence;
            var beatHeight = height * 3*beat.prominence;
            var beat = this.paper.rect(beat.startTime, 
                                       this.freqToY(complexNote[i].frequency, beatHeight),
                                       beat.endTime - beat.startTime, 
                                       beatHeight).attr({fill: color, stroke:'none', opacity: opacity});
            var beatBlinkOn = function(){
              beat.animate({opacity:opacity}, 1000/beat.frequency, beatBlinkOff);
            }
            var beatBlinkOff = function(){
              beat.animate({opacity:0}, 1000/beat.frequency, beatBlinkOn);
            }
            beatBlinkOff();
          }.apply(this);
        }
      }
    };

    this.log2 = function(val){
      return Math.log(val) / Math.log(2);
    };

    return this;
  };
      
  return new App();
});
