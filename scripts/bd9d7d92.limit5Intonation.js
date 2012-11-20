define(["equalTemperament"], function(equalTemperament){
  return function(pitchClass) {
    var pitchClassMap = [
      1,
      16/15,
      9/8,
      6/5,
      5/4,
      4/3,
      45/32,
      3/2,
      8/5,
      5/3,
      9/5,
      15/8,
    ];

    return function(note){
      var refPitchNoteNum = pitchClass + 60;
      var refPitchFrequency = equalTemperament(refPitchNoteNum).frequency;

      while(note < refPitchNoteNum){
        refPitchNoteNum -= 12;
        refPitchFrequency /= 2;
      }
      while(note - refPitchNoteNum >= 12){
        refPitchNoteNum += 12;
        refPitchFrequency *= 2;
      }

      var ratio = pitchClassMap[note - refPitchNoteNum];
      return {
        frequency: ratio * refPitchFrequency,
        name: equalTemperament(refPitchNoteNum).name
      };
    };
  };
});
