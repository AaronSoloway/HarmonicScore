define(['equalTemperament', 'limit5intonation', 'freqToColor', 'beats'], function(equalTemperament, limit5, freqToColor, GetBeat) {
  function App() {

    this.intonation = equalTemperament;
    this.key = 0;

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
    this.animateBeats = true;

    // holds unprocessed notes
    this.data = [];
    // notes holds processed note data
    this.notes = [];
    // beats holds processed beat data
    this.beats = [];
    // holds the time where the last note ends.
    this.maxTime = 100;
    // the height is always scaled to "1"
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

    this.ProcessData = function() {
      data = this.data;

      // clear the events
      this.ClearEvents();

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
    }

    this.MidiChanged = function(data){
      this.data = data;

      this.ProcessData();
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
      this.notes = [];
      this.beats = [];
      this.Clear();
    }

    this.SetIntonation = function(key, intone){
      console.log(key, intone);
      this.key = key;
      if(intone === "equal")
        this.intonation = equalTemperament;
      else
        this.intonation = limit5(key);
    } 

    this.Clear = function(){
       this.paper.clear();
      this.placemat = this.paper.rect(0,0,this.canvasW,this.canvasH).attr({"fill" : "#333333", 'stroke':'none' });
    };


    // This checks to see if the passed-in note beats against
    // any currently-sounding notes
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
            f2.beats.push({
              'baseFreq': f2,
              'other': f1,
              'frequency': beat.frequency,
              'prominence': beat.prominence,
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

    // Checks if the current note ends any currently
    // ringing beats
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
        // that contains this as an overtone,
        // and add them to our global list of beats.
        var oldBeats = this.currentBeats;
        this.currentBeats = [];
        for(j = 0; j < oldBeats.length; ++j){
          if((oldBeats[j].f1 !== overtone) &&
             (oldBeats[j].f2 !== overtone))
            this.currentBeats.push(oldBeats[j]);
          else
            this.beats.push(oldBeats[j]);
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

          // Check if this note causes any new beats
          this.CheckForNewBeats(note);

          this.currentNotes.push(note);
          break;

        case 'noteOff':
          for(var i = 0; i < this.currentNotes.length; ++i)
          {
            var note = this.currentNotes[i];
            if (filter(note)) {
              note.endTime = event.time;

              // check if this note ends any beats
              this.CheckForBeatsEnd(note);

              // add this to our list of processed notes
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
      note.complexNote[0] = {'frequency':this.intonation(note.noteMIDINum).frequency, 'beats':[]};

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

      // go through each harmonic
      for (var i = 0; i < complexNote.length; i++) {
        
        // calculate visible height of note
        if(i===0)
          height = this.funFreqHeight;
        else
          height = this.harmFreqHeight;

        // calculate color
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

        // create an SVG rect representing this note
        this.paper.rect(note.startTime, 
                        this.freqToY(complexNote[i].frequency, height),
                        note.endTime - note.startTime, 
                        height).attr({fill: color, stroke:'none', opacity: harmonicOpacity});

        for(var j = 0; j < complexNote[i].beats.length; ++j){
          // wrap in a closure so we can keep scope
          var a = function(){
            var beatInfo = complexNote[i].beats[j];
            var minOpacity = harmonicOpacity - (beatInfo.prominence / 2 * harmonicOpacity);
            var maxOpacity = harmonicOpacity + (beatInfo.prominence / 2 * harmonicOpacity);

            var beatHeight = this.harmFreqHeight * 4 * beatInfo.prominence;
            var beat = this.paper.rect(beatInfo.startTime, 
                                       this.freqToY(complexNote[i].frequency, beatHeight),
                                       beatInfo.endTime - beatInfo.startTime, 
                                       beatHeight)
            if(this.animateBeats){
              beat.attr({fill: color, stroke:'none', opacity: maxOpacity});
              var beatBlinkOn = function(){
                beat.animate({'opacity':maxOpacity}, 1e4/beatInfo.frequency, beatBlinkOff);
              }
              var beatBlinkOff = function(){
                beat.animate({'opacity':minOpacity}, 1e4/beatInfo.frequency, beatBlinkOn);
              }
              beatBlinkOff();
            } else {
              beat.attr({fill: '#fff', stroke:'none', 'opacity':beatInfo.prominence/10});
            }
          }.apply(this);
        }
        
        // each harmonic should have slightly less opacity
        harmonicOpacity = harmonicOpacity - 0.1;
      }
    };

    this.log2 = function(val){
      return Math.log(val) / Math.log(2);
    };

    return this;
  };
      
  return new App();
});
