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
    
    $("#bwSelect").click(function() {
      $("#bwSelect").parent().addClass('active');
      $("#colorSelect").parent().removeClass('active');
      app.SetUseColor(false);
    });

    $("#colorSelect").click(function() {
      $("#colorSelect").parent().addClass('active');
      $("#bwSelect").parent().removeClass('active');
      app.SetUseColor(true);
    });

    $("#logScale").click(function() {
      $("#logScale").parent().addClass('active');
      $("#linScale").parent().removeClass('active');
      app.SetLogScale(true);
    });

    $("#linScale").click(function() {
      $("#linScale").parent().addClass('active');
      $("#logScale").parent().removeClass('active');
      app.SetLogScale(false);
    });

    $("#animateBeats").click(function() {
      $("#animateBeats").parent().addClass('active');
      $("#highlightBeats").parent().removeClass('active');
      app.SetAnimateBeats(true);
    });

    $("#highlightBeats").click(function() {
      $("#highlightBeats").parent().addClass('active');
      $("#animateBeats").parent().removeClass('active');
      app.SetAnimateBeats(false);
    });

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
