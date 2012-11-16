define([], function(){

  // utility function:
  // given a frequncy, what is the highest detectable frequency it can beat?
  function FrequencyToHighestBeatFrequency(f){
    return 20;
  };

  // here, given two frequencies, we have to return an object containing
  // { frequency, prominence } or a null value if there is no beating.
  return function(f1, f2){
    // calculate the difference in frequency.  This is the beat frequency
    var diffFreq = Math.abs(f1-f2);

    // this is the average of the two frequencies
    var aveFreq = (f1 + f2)/2;

    // what is the highest detectable beat?
    var highBeatFreq = FrequencyToHighestBeatFrequency(aveFreq);

    // if the beat is undetectable, return nothing
    if(diffFreq > highBeatFreq)
      return null;
    if(diffFreq <= highBeatFreq * .04)
      return null;

    // prominence maxes out at .4 * the max frequency - I assume it's 
    // linear from there.
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
