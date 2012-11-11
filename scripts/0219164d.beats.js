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

    var prominence;
    var maxProm = highBeatFreq * .4;
    if(diffFreq < maxProm)
      prominence = 1 - (maxProm - diffFreq)/maxProm;
    else
      prominence = 1 - (diffFreq - maxProm)/(highBeatFreq - maxProm);

    return {prominence: prominence,
            frequency: diffFreq};
  };
});
