// dependencies
define(['equalTemperament', 'limit5intonation', 'svg', 'processor', 'aria'], function(equalTemperament, limit5, SVG, ProcessNotes, aria) {

  function App() {

    ///////////////////////
    // Display variables
    ///////////////////////

    // this.intonation is a function that goes from midi note to frequency.
    // by default we use equal temperament, but this can be changed from the
    // SetIntonation function (see below).
    this.intonation = equalTemperament;

    // holds parsed, unprocessed MIDI data
    this.data = aria;  // by default, use the pre-parsed Bach Aria from aria.js
    // this holds processed note data.  processing involves converting delta-time into absolute times, calculating all harmonics, and calculating all beats.
    this.processedNotes = [];

    // OnLoad gets called when the app loads.  
    // it just processes the loaded MIDI data.
    this.OnLoad = function(){
      this.drawer = new SVG();
      this.ProcessData();
    };

    // This converts unprocessed MIDI data into our processed midi data.
    // it will also render the processed notes.
    this.ProcessData = function() {
      // process the data
      this.processedNotes = ProcessNotes(this.data, this.intonation);

      // give the notes to the drawer.
      this.drawer.SetNotes(this.processedNotes);
    }

    // this gets called when the MIDI data changes
    this.MidiChanged = function(data){
      this.data = data;

      this.ProcessData();
    };


    this.SetIntonation = function(key, intone){
      if(intone === "equal")
        this.intonation = equalTemperament;
      else
        this.intonation = limit5(key);
      this.ProcessData();
    } 
    
    // pass through drawing setters directly to drawer object
    var that = this;
    var DoDrawerPassthrough = function(name){
      that[name] = function(){
        that.drawer[name].apply(that.drawer, arguments);
      };
    };

    DoDrawerPassthrough("SetAnimateBeats");
    DoDrawerPassthrough("SetUseColor");
    DoDrawerPassthrough("SetLogScale");

    return this;
  };
      
  return new App();
});
