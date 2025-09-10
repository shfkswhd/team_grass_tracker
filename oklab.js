// OKLAB 변환 함수 (간단 버전)
// 참고: https://bottosson.github.io/posts/oklab/

// sRGB -> Linear
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Linear -> sRGB
function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
}

// RGB(0~255) -> OKLAB
function rgbToOklab(r, g, b) {
  r = srgbToLinear(r / 255);
  g = srgbToLinear(g / 255);
  b = srgbToLinear(b / 255);

  // LMS 변환
  let l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b;
  let m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b;
  let s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b;

  l = Math.cbrt(l);
  m = Math.cbrt(m);
  s = Math.cbrt(s);

  // OKLAB
  return {
    L: 0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
    a: 1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
    b: 0.0259040371*l + 0.7827717662*m - 0.8086757660*s
  };
}

// OKLAB -> RGB(0~255)
function oklabToRgb(L, a, b) {
  // 역변환
  let l = L + 0.3963377774*a + 0.2158037573*b;
  let m = L - 0.1055613458*a - 0.0638541728*b;
  let s = L - 0.0894841775*a - 1.2914855480*b;

  l = l*l*l;
  m = m*m*m;
  s = s*s*s;

  let r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s;
  let g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s;
  let b_ = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s;

  r = linearToSrgb(r);
  g = linearToSrgb(g);
  b_ = linearToSrgb(b_);

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b_ * 255)))
  };
}

// 진하기(0~1)와 사용자 색상(HEX)으로 잔디 색상 반환
function getGrassColor(hex, intensity) {
  // HEX -> RGB
  let r = parseInt(hex.slice(1,3), 16);
  let g = parseInt(hex.slice(3,5), 16);
  let b = parseInt(hex.slice(5,7), 16);
  let oklab = rgbToOklab(r, g, b);
  // 밝기(L)만 intensity에 따라 조절
  let L = oklab.L * (0.7 + 0.3 * intensity); // 0.7~1.0 범위
  let rgb = oklabToRgb(L, oklab.a, oklab.b);
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

module.exports = { rgbToOklab, oklabToRgb, getGrassColor };
