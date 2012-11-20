define(["colors"], function(color){
  return function(freq, referenceFreq, brightness) {
    var saturation = 75;
    var value = 99;

    // standardize freq to 1 to 2 times reference.
    while(freq < referenceFreq) {
      freq *= 2;
    }
    while(freq > referenceFreq * 2){
      freq /= 2;
    }

    // convert freq from 0 to 1
    freq /= referenceFreq;
    freq -= 1;
    freq %= 1;

    // freq
    var rgbCol = color.hsv2rgb(freq * 360, saturation * brightness, value * brightness);
    var hexCol = color.rgb2hex.apply(this, rgbCol.a);
    return hexCol;
  }
});
