define [], ->
  class App
    MidiChanged: (data) ->
      @ClearEvents()
      time = 0
      for x in data
        @HandleEvent(x[0].event, time)
        time += x[0].ticksToEvent

    ClearEvents: ->
      @currentNotes = []

    HandleEvent: (event, time) ->
      return if event.type isnt 'channel'
      switch event.subtype
        when 'noteOn'
          @currentNotes.push
            note: event.noteNumber
            channel: event.channel
            startTime: time
          
        when 'noteOff'
          filter = (note) ->
            note.channel is event.channel and note.note is event.noteNumber
            
          for note in @currentNotes
            if filter(note)
              note.endTime = time
              @DrawNote note
          @currentNotes = for n in @currentNotes when not filter(n) then n
          
    DrawNote: (note) ->
      console.log note
  return new App()