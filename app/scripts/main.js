require.config({
  shim: {
  },

  paths: {
    jquery: 'vendor/jquery.min'
  }
});
 
require(['midifile', 'app'], function(midifile, app) {

    $("#file-input").change(function() {
        reader = new FileReader();
        reader.onloadend = function() {
            app.MidiChanged(midifile(reader.result));
        }
        reader.readAsBinaryString(this.files[0]);
    });
    

});
