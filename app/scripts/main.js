require.config({
  shim: {
  },

  paths: {
    jquery: 'vendor/jquery.min'
  }
});
 
require(['midifile', 'app', 'replayer', 'bootstrap'], function(midifile, app, Replayer) {

    app.OnLoad();

    $("#file-input").change(function() {
      var reader = new FileReader();
      reader.onloadend = function() {
        var replayer = new Replayer(midifile(reader.result));
        app.MidiChanged(replayer.getData());
      }
      reader.readAsBinaryString(this.files[0]);
    });

    // meta-function to create handlers for checkbox pairs
    var MakeCheckBoxPair = function(trueElem, falseElem, appMethod){
      $(falseElem).click(function() {
        $(falseElem).parent().addClass('active');
        $(trueElem).parent().removeClass('active');
        app[appMethod](false);
      });
      $(trueElem).click(function() {
        $(trueElem).parent().addClass('active');
        $(falseElem).parent().removeClass('active');
        app[appMethod](true);
      });
    }
    
    MakeCheckBoxPair('#colorSelect', '#bwSelect', 'SetUseColor');
    MakeCheckBoxPair('#logScale', '#linScale', 'SetLogScale');
    MakeCheckBoxPair('#animateBeats', '#highlightBeats', 'SetAnimateBeats');

    $("#equalTemperament").click(function() {
      $("#equalTemperament").parent().addClass('active');
      $(".limit5").parent().removeClass('active');
      app.SetIntonation(0, "equal");
    });
  
    $(".limit5").click(function(a) {
      $("#equalTemperament").parent().removeClass('active');
      $(".limit5").parent().removeClass('active');
      $(a.target).parent().addClass('active');
      app.SetIntonation(parseInt(a.target.getAttribute('id')), "limit5");
    });
});
