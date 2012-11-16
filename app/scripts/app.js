
// dependencies
define(['equalTemperament', 'limit5intonation', 'freqToColor', 'processor', 'aria'], function(equalTemperament, limit5, freqToColor, ProcessNotes, aria) {

  function App() {
    ///////////////////////
    // Constants
    ///////////////////////

    this.maxLogFrequency = 20000;   // max frequency in log mode
    this.maxLinFrequency = 5000;    // max frequency in linear mode
    this.minLogFrequency = 20;      // minimum frequency in log mode
    this.pixelsPerBeat = 80;        // the number of pixels per MIDI beat on the x-axis
    this.funFreqHeight = 130/this.maxLogFrequency; // height of fundamentals
    this.harmFreqHeight = 50/this.maxLogFrequency; // height of harmonics
    this.funBrightness = .9;       // brightness of fundamentals
    this.harmBrightness = .8;      // brightness of harmonics
    this.height = 1;               // the logical height

    // pre-computed logs for efficiency? - I'm not sure these are needed
    this.logMaxFreq = Math.log(this.maxLogFrequency);
    this.logMinFreq = Math.log(this.minLogFrequency);
    this.logMaxFreqMinuslogMinFreq = this.logMaxFreq - this.logMinFreq;

    ///////////////////////
    // Display variables
    ///////////////////////

    // this.intonation is a function that goes from midi note to frequency.
    // by default we use equal temperament, but this can be changed from the
    // SetIntonation function (see below).
    this.intonation = equalTemperament;

    this.useColor = true;  // color or black and white?
    this.logScale = true;  // log scale for frequency? (as opposed to linear)
    this.animateBeats = true; // animate the detected beats?

    // holds parsed, unprocessed MIDI data
    this.data = aria;  // by default, use the pre-parsed Bach Aria from aria.js
    // this holds processed note data.  processing involves converting delta-time into absolute times, calculating all harmonics, and calculating all beats.
    this.processedNotes = [];

    // holds the time where the last note ends.  This is the maximum dimension of the logical x axis
    this.maxTime = 100; // just give it some stupid value by default - this will be reset when we process our default data.

    // OnLoad gets called when the app loads.  
    // it just processes the loaded MIDI data.
    this.OnLoad = function(){
      // create Raphael paper on which to draw
      this.paper = new Raphael('score');
      this.SetViewBox(this.maxTime, this.height);
      this.paper.canvas.setAttribute('height', '100%');
      this.ProcessData();
    };

    // Render draws the processed MIDI data to the screen.
    this.Render = function(){
      this.Clear();

      // draw each note
      for(var i = 0; i < this.processedNotes.length; ++i){
        this.DrawNote(this.processedNotes[i]);
      }
    }

    // This converts unprocessed MIDI data into our processed midi data.
    // it will also render the processed notes.
    this.ProcessData = function() {
      // clear the events
      this.ClearEvents();

      // process the data
      this.processedNotes = ProcessNotes(this.data, this.intonation);

      // the new "max time" is the end of the last note
      if(this.processedNotes.length)
        this.maxTime = this.processedNotes[this.processedNotes.length - 1].endTime;
      else
        this.maxTime = 1;

      // set the logical bounds of the paper to the height and maxTime
      this.SetViewBox(this.maxTime, this.height);
      
      // set the physical bounds based on maxTime
      this.ResizeCanvas();

      // draw all the notes
      this.Render();
    }

    // this gets called when the MIDI data changes
    this.MidiChanged = function(data){
      this.data = data;

      this.ProcessData();
    };

    // sets the physical bounds of the canvas to this * maxTime
    this.ResizeCanvas = function(){
      this.paper.canvas.setAttribute('width', this.maxTime * this.pixelsPerBeat);
    };
    
    // sets the logical bounds of the canvas
    this.SetViewBox = function(w, h){
      this.paper.setViewBox(0, 0, w, h, true);
      this.paper.canvas.setAttribute('preserveAspectRatio', 'none');
      this.canvasW = w;
      this.canvasH = h;
    };

    // clears all the cached events
    this.ClearEvents = function(){
      this.currentNotes = [];
      this.currentBeats = [];
      this.processedNotes = [];
      this.Clear();
    }

    this.SetIntonation = function(key, intone){
      if(intone === "equal")
        this.intonation = equalTemperament;
      else
        this.intonation = limit5(key);
    } 

    this.Clear = function(){
       this.paper.clear();
      this.placemat = this.paper.rect(0,0,this.canvasW,this.canvasH).attr({"fill" : "#333333", 'stroke':'none' });
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
