define([], function() {
  function App() {

    this.pixelsPerBeat = 80;

    this.OnLoad = function(){
      //define progromatically based on window size
      var x = 300; 
      var y = 205; 

      // make something up.
      this.maxTime = 100;
      this.height = 128;

      // created Raphael paper on which to draw
      this.paper = new Raphael('score');
      this.SetViewBox(this.maxTime, this.height);
      this.paper.canvas.setAttribute('height', '100%');
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
    }

    this.MidiChanged = function(data){
      // Run through whole file converting from delta times to
      // absolute time.
      var time = 0;
      for(var i = 0; i < data.length; ++i){
        time += data[i][0].beatsToEvent;
        data[i][0].event.time = time;
      }

      // clear the events
      this.ClearEvents();

      // set the maximum time to the last note's time.
      this.maxTime = data[data.length - 1][0].event.time
      this.SetViewBox(this.maxTime, this.height);
      this.ResizeCanvas();

      // Run through each event and "handle it"
      for(i = 0; i < data.length; ++i){
        this.HandleEvent(data[i][0].event);
      }

    };

    this.ResizeCanvas = function(){
      this.paper.canvas.setAttribute('width', this.maxTime * this.pixelsPerBeat);
      if(this.placemat)
        this.placemat.remove();
      this.placemat = this.paper.rect(0,0,this.canvasW,this.canvasH).attr({"fill" : "#333333", 'stroke':'none' });
    }
    
    this.SetViewBox = function(w, h){
      this.paper.setViewBox(0, 0, w, h, true);
      this.paper.canvas.setAttribute('preserveAspectRatio', 'none');
      this.canvasW = w;
      this.canvasH = h;
    }

    this.ClearEvents = function(){
      this.currentNotes = [];
    };

    this.HandleEvent =  function(event){
      if (event.type !== 'channel') {
          return;
      }
      var filter = function(note){
        return (note.channel === event.channel) && (note.note === event.noteNumber);
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
      this.paper.rect(note.startTime, (128 - note.note) - .5, note.endTime - note.startTime, 1).attr({fill: "#f00", stroke:'none'});
    };

    return this;
  };
      
  return new App();
});
