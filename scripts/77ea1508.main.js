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
      app.useColor = false;
      app.Render();
    });

    $("#colorSelect").click(function() {
      $("#colorSelect").parent().addClass('active');
      $("#bwSelect").parent().removeClass('active');
      app.useColor = true;
      app.Render();
    });
});
