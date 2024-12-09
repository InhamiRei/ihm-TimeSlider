import ihm_TimeSlider from "./components/timeSlider.js";

function ihmTimeSilder(el, config) {
  return new ihm_TimeSlider(el, config);
}

window.ihmTimeSilder = ihmTimeSilder;
export default ihmTimeSilder;
