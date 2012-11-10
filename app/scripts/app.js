define([], function() {
  function App() {
    this.pixelsPerBeat = 20;


    this.OnLoad = function(){
      //define progromatically based on window size
      var x = 300; 
      var y = 205; 
      var width = 850; 
      this.height = 200; 

      // make something up.
      this.maxTime = 850;

      // created Raphael paper on which to draw
      this.paper = new Raphael(x, y, this.maxTime, this.height);
      this.ResizeCanvas();

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

      this.paper.roundedRectangle(500, 70, 80, 5, 1, 1, 1, 1).attr({fill: "#f00"});
    }

    this.MidiChanged = function(data){
      // Run through whole file converting from delta times to
      // absolute time.
      var time = 0;
      for(var i = 0; i < data.length; ++i){
        data[i][0].time = time;
        time += data[i][0].beatsToEvent;
      }

      // clear the events
      this.ClearEvents();

      // set the maximum time to the last note's time.
      this.maxTime = data[data.length - 1][0].time;
      this.ResizeCanvas();

      // Run through each event and "handle it"
      for(i = 0; i < data.length; ++i){
        this.HandleEvent(data[i][0].event);
      }

    };

    this.ResizeCanvas = function(){
      this.paper.setSize(this.maxTime * this.pixelsPerBeat, this.height);
      if(this.placemat)
        this.placemat.remove();
      this.placemat = this.paper.rect(0,0,this.paper.width,this.paper.height).attr({"fill" : "#333333" });
    }

    this.ClearEvents = function(){
      this.currentNotes = [];

      var placemat = this.paper.rect(0,0,this.paper.width,this.paper.height).attr({"fill" : "#333333" });
      

    };

    this.HandleEvent =  function(event){
      if (event.type !== 'channel') {
          return;
      }

      switch(event.subtype){
        case 'noteOn':
          this.currentNotes.push({
            note: event.noteNumber,
            channel: event.channel,
            startTime: event.time
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
              note.endTime = event.time;
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
    };
    return this;
  };
      
  return new App();
});
