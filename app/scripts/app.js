define([], function() {
  function App() {
    this.OnLoad = function(){
      console.log("hey");

      //define progromatically based on window size
      var x = 300; 
      var y = 205; 
      var width = 850; 
      var height = 200; 

      // created Raphael paper on which to draw
      var paper = new Raphael(x, y, width, height); //option (a) 
      
      // color background so you know where the canvas is
      var placemat = paper.rect(0,0,paper.width,paper.height).attr({"fill" : "#333333" });
      
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

      //Pretend!  This is what a few nots might look like sans harmonics
      paper.roundedRectangle(10, 10, 80, 5, 1, 1, 1, 1).attr({fill: "#f00"});
      paper.roundedRectangle(100, 150, 80, 5, 1, 1, 1, 1).attr({fill: "#f00"});
      paper.roundedRectangle(200, 100, 80, 5, 1, 1, 1, 1).attr({fill: "#f00"});
      paper.roundedRectangle(500, 70, 80, 5, 1, 1, 1, 1).attr({fill: "#f00"});
      
      console.log("loaded");
    }
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
