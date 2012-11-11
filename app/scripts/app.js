define(['mtofTable', 'freqToColor'], function(mtof, freqToColor) {
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
      this.data = [];
      this.notes = [];
      this.Clear();
    }

    this.Clear = function(){
       this.paper.clear();
      this.placemat = this.paper.rect(0,0,this.canvasW,this.canvasH).attr({"fill" : "#333333", 'stroke':'none' });
    };

    this.HandleEvent =  function(event){
      
      if (event.type !== 'channel') {
          return;
      }
      var filter = function(note){
        return (note.channel === event.channel) && (note.noteMIDINum === event.noteNumber);
      }
      switch(event.subtype){
        case 'noteOn':
          this.currentNotes.push({
            noteMIDINum: event.noteNumber,
            channel: event.channel,
            startTime: event.time
          })
        
          break;
        case 'noteOff':
          for(var i = 0; i < this.currentNotes.length; ++i)
          {
            var note = this.currentNotes[i];
            if (filter(note)) {
              note.endTime = event.time;
              this.CalculateHarmonics(note);
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
      note.complexNote = new Array();
      note.complexNote[0] = mtof(note.noteMIDINum).frequency;

      for (var i = 1; i < this.numHarmonics; i++) {
        note.complexNote[i] = (i+1)*note.complexNote[0];
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
      var harmColor, funColor;
      var complexNote = note.complexNote;

      if(this.useColor)
        funColor = freqToColor(complexNote[0], 440, this.funBrightness);
      else
        funColor = "#f00";
      
      var that = this;


      this.paper.rect(note.startTime, 
                      this.freqToY(complexNote[0], this.funFreqHeight),
                      note.endTime - note.startTime, 
                      this.funFreqHeight).attr({fill: funColor, stroke:'none'});
      var harmonicOpacity = 0.9;
      for (var i = 1; i < complexNote.length; i++) {
        if(this.useColor)
          harmColor =  freqToColor(complexNote[i], 440, this.harmBrightness);
        else
          harmColor= "#f55";

        this.paper.rect(note.startTime, 
                        this.freqToY(complexNote[i], this.harmFreqHeight),
                        note.endTime - note.startTime, 
                        this.harmFreqHeight).attr({fill: harmColor, stroke:'none', opacity: harmonicOpacity});
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
