require.config({
  shim: {
  },

  paths: {
    jquery: 'vendor/jquery.min'
  }
});
 
require(['midifile', 'app', 'replayer'], function(midifile, app, Replayer) {

    $("#file-input").change(function() {
        reader = new FileReader();
        reader.onloadend = function() {
            var replayer = new Replayer(midifile(reader.result));
            app.MidiChanged(replayer.getData());
        }
        reader.readAsBinaryString(this.files[0]);
    });
    

});
