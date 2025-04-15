import ihm_TimeSlider from "./components/TimeSlider.js";

function ihmTimeSilder(el, config) {
  return new ihm_TimeSlider(el, config);
}

window.ihmTimeSilder = ihmTimeSilder;
export default ihmTimeSilder;
