define([], function() {
  function App() {
    this.MidiChanged = function(data){
      this.ClearEvents();
      var time = 0;
      for(var i = 0; i < data.length; ++i)
      {
        this.HandleEvent(data[i][0].event, time);
        time += data[i][0].ticksToEvent;
      }
    };

    this.ClearEvents = function(){
      this.currentNotes = [];
    };

    this.HandleEvent =  function(event, time){
      if (event.type !== 'channel') {
          return;
      }

      switch(event.subtype){
        case 'noteOn':
          this.currentNotes.push({
            note: event.noteNumber,
            channel: event.channel,
            startTime: time
          })
          break;
        case 'noteOff':
          var filter = function(note){
            return (note.channel === event.channel) && (note.note === event.noteNumber);
          }

          for(var i = 0; i < this.currentNotes.length; ++i)
          {
            var note = this.currentNotes[i];
            if (filter(note)) {
              note.endTime = time;
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

    this.DrawNote = function(note){
      console.log(note);
    };
    return this;
  };
      
  return new App();
});
