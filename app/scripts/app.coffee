define [], ->
  class App
    MidiChanged: (newMidiFile) ->
      console.log newMidiFile

  return new App()