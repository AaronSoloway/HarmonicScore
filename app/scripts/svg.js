// This defines the SVG drawing procedures for harmonicscore.
// This gets a processed notes array from the app
// (see processor.js for a description of the processed note format)
// and is responsible for displaying it to the user.
//
// In the future, there may be other drawing methods using the
// same interface.
// 
// This module is a class with the following functions:
//  SetUseColor(bool) : this determines whether or not we should draw in color
//  SetLogScale(bool) : whether or not we should use log frequency scaling rather than linear
//  SetAnimateBeats(bool): whether or not we should animate the beats
//  SetNotes(note array): changes the notes to display
// 
define(['freqToColor'], function(freqToColor){
  return function(){
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
    // Member Variables
    ///////////////////////

    this.useColor = true;  // color or black and white?
    this.logScale = true;  // log scale for frequency? (as opposed to linear)
    this.animateBeats = true; // animate the detected beats?

    // list of processed notes to draw.
    this.notes = [];

    // create the canvas
    // create Raphael paper on which to draw
    this.paper = new Raphael('score');

    // holds the time where the last note ends.  This is the maximum dimension of the logical x axis
    this.maxTime = 100; // just give it some stupid value by default - this will be reset when we process our default data.

    ///////////////////////
    // Private functions
    ///////////////////////

    var that = this; // crockford-style convention.  This is unnessary in coffeescript.

    // 'SetViewBox' edits the *LOGICAL* coordinates of the SVG.
    var SetViewBox = function(w, h){
      that.paper.setViewBox(0, 0, w, h, true);

      // we need to set this because raphael fucks it up everytime we call setviewbox.
      that.paper.canvas.setAttribute('preserveAspectRatio', 'none');

      // resize the placemat to the full logical size
      if(that.placemat)
        that.placemat.remove();

      that.placemat = that.paper.rect(0,0,w,h).attr({'fill' : '#333333', 'stroke':'none' });
    };

    // this is the big one!  this will draw a complete note on the canvas
    var DrawNote = function(note){
      var color, height;
      var complexNote = note.complexNote;
      var harmonicOpacity = 1;

      // go through each harmonic
      for (var i = 0; i < complexNote.length; i++) {
        
        // calculate visible height of note
        if(i===0)
          height = that.funFreqHeight;
        else
          height = that.harmFreqHeight;

        // calculate color
        if(that.useColor)
        {
          if(i!==0)
            color = freqToColor(complexNote[i].frequency, 440, that.harmBrightness);
          else
            color = freqToColor(complexNote[0].frequency, 440, that.funBrightness);
        }
        else
        {
          if(i!==0)
            color= '#f55';
          else
            color= '#f00';
        }

        // create an SVG rect representing this note
        that.paper.rect(note.startTime, 
                        FreqToY(complexNote[i].frequency, height),
                        note.endTime - note.startTime, 
                        height).attr({fill: color, stroke:'none', opacity: harmonicOpacity});

        for(var j = 0; j < complexNote[i].beats.length; ++j){
          // wrap in a closure so we can keep scope
          var a = function(){
            var beatInfo = complexNote[i].beats[j];
            var minOpacity = harmonicOpacity - (beatInfo.prominence / 2 * harmonicOpacity);
            var maxOpacity = harmonicOpacity + (beatInfo.prominence / 2 * harmonicOpacity);

            var beatHeight = that.harmFreqHeight * 4 * beatInfo.prominence;
            var beat = that.paper.rect(beatInfo.startTime, 
                                       FreqToY(complexNote[i].frequency, beatHeight),
                                       beatInfo.endTime - beatInfo.startTime, 
                                       beatHeight)
            if(that.animateBeats){
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


    // converts frequency to logical y dimension
    var FreqToY = function(f, h){
      if(that.logScale)
        return 1 - (h / 2) - (Math.log(f) - that.logMinFreq) / that.logMaxFreqMinuslogMinFreq;
      else
        return 1 - (h / 2) - f/that.maxLinFrequency;
    };

    var Render = function(){
      that.paper.clear()

      // update the logical canvas size and redraw the background
      SetViewBox(that.maxTime, that.height);

      // update the physical canvas size
      that.paper.canvas.setAttribute('width', that.maxTime * that.pixelsPerBeat);

      // draw each note
      for(var i = 0; i < that.notes.length; ++i){
        DrawNote(that.notes[i]);
      }
    }

    ///////////////////////
    // Public Functions
    ///////////////////////

    // generate setters:
    var Setter = function(setterName, setterKey){
      that[setterName] = function(x){
        that[setterKey] = x;
        Render();
      };
    }
    
    Setter('SetLogScale', 'logScale');
    Setter('SetAnimateBeats', 'animateBeats');
    Setter('SetUseColor', 'useColor');

    this.SetNotes = function(notes){
      // save the notes
      this.notes = notes;

      // the new 'max time' is the end of the last note
      if(this.notes.length)
        this.maxTime = this.notes[this.notes.length - 1].endTime;
      else
        this.maxTime = 1;

      Render();
    };

    ///////////////////////
    // Initialization
    ///////////////////////

    // start with a view box determined by the default max time
    SetViewBox(this.maxTime, this.height);

    // this magic incantation makes the physical height of the canvas track the window size.
    this.paper.canvas.setAttribute('height', '100%');

    return this;
  };
});
