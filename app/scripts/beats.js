define([], function(){
  function FrequencyToHighestBeatFrequency(f){
    return 20;
  };
  return function(f1, f2){
    var diffFreq = Math.abs(f1-f2);
    var aveFreq = (f1 + f2)/2;
    var highBeatFreq = FrequencyToHighestBeatFrequency(aveFreq);
    if(diffFreq > highBeatFreq)
      return 0;
    if(diffFreq <= highBeatFreq * .04)
      return 0;

    return {prominence: .8,
            frequency: diffFreq};
  };
});
