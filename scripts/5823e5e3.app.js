define(['mtofTable', 'freqToColor'], function(mtof, freqToColor) {
  function App() {

    this.maxFrequency = 20000;
    this.minFrequency = 20;
    this.numHarmonics = 10;
    this.pixelsPerBeat = 80;
    this.funFreqHeight = 130/this.maxFrequency; //this puts it in terms of frequency height
    this.harmFreqHeight = 50/this.maxFrequency; //this puts it in terms of frequency height

    this.funBrightness = .9; // "V" value in HSV of fundamental
    this.harmBrightness = .8;

    this.useColor = true;

    this.data = [];

    // pre-computed logs for efficiency?
    this.logMaxFreq = Math.log(this.maxFrequency);
    this.logMinFreq = Math.log(this.minFrequency);
    this.logMaxFreqMinuslogMinFreq = this.logMaxFreq - this.logMinFreq;

    this.OnLoad = function(){
      //define based on window size
      var x = 300; 
      var y = 205; 

      // make something up.
      this.maxTime = 100;
      this.height = 1;

      // created Raphael paper on which to draw
      this.paper = new Raphael('score');
      this.SetViewBox(this.maxTime, this.height);
      this.paper.canvas.setAttribute('height', '100%');
      this.ResizeCanvas();
      this.ClearEvents();

      // taken from http://jsdo.it/remmel/1qGu
      // roundedRectangle(x, y, width, height, upper_left_corner, upper_right_corner, lower_right_corner, lower_left_corner)
      Raphael.fn.roundedRectangle = function (x, y, w, h, r1, r2, r3, r4){
        var array = [];
        array = array.concat(["M",x,r1+y, "Q",x,y, x+r1,y]); //A
        array = array.concat(["L",x+w-r2,y, "Q",x+w,y, x+w,y+r2]); //B
        array = array.concat(["L",x+w,y+h-r3, "Q",x+w,y+h, x+w-r3,y+h]); //C
        array = array.concat(["L",x+r4,y+h, "Q",x,y+h, x,y+h-r4, "Z"]); //D

        return this.path(array);
      };
    };

    this.Render = function(){
      // clear the events
      this.ClearEvents();
      
      var data = this.data;

      // set the maximum time to the last note's time.
      this.maxTime = data[data.length - 1][0].event.time
      this.SetViewBox(this.maxTime, this.height);
      this.ResizeCanvas();

      // Run through each event and "handle it"
      for(i = 0; i < data.length; ++i){
        this.HandleEvent(data[i][0].event);
      }
    }

    this.MidiChanged = function(data){
      this.data = data;

      // Run through whole file converting from delta times to
      // absolute time.
      var time = 0;
      for(var i = 0; i < data.length; ++i){
        time += data[i][0].beatsToEvent;
        data[i][0].event.time = time;
      }

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
      this.paper.clear();
      if(this.placemat)
        this.placemat.remove();
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
              this.DrawNote(note);
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
      var complexNote = new Array();
      complexNote[0] = mtof(note.noteMIDINum).frequency;

      for (var i = 1; i < this.numHarmonics; i++) {
        complexNote[i] = (i+1)*complexNote[0];
      }
      return complexNote;
    };


    // Draws a note on the paper 
    this.DrawNote = function(note){
      var complexNote = new Array();
      complexNote = this.CalculateHarmonics(note);

      var harmColor, funColor;

      if(this.useColor)
        funColor = freqToColor(complexNote[0], 440, this.funBrightness);
      else
        funColor = "#f00";
      
      this.paper.rect(note.startTime, 
                      1 - (this.funFreqHeight / 2) - (Math.log(complexNote[0]) - this.logMinFreq) / this.logMaxFreqMinuslogMinFreq,                         
                      note.endTime - note.startTime, 
                      this.funFreqHeight).attr({fill: funColor, stroke:'none'});
      var harmonicOpacity = 0.9;
      for (var i = 1; i < complexNote.length; i++) {
        if(this.useColor)
          harmColor =  freqToColor(complexNote[i], 440, this.harmBrightness);
        else
          harmColor= "#f55";

        this.paper.rect(note.startTime, 
                        1 - (this.harmFreqHeight / 2) - (Math.log(complexNote[i]) - this.logMinFreq) / this.logMaxFreqMinuslogMinFreq,                         
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
