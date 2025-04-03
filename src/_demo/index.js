import { rawData, demoData } from "./rawData.js";
import ihm_TimeSlider from "../components/timeSlider.js";

// console.log("rawData", rawData);

const transformData = (data) => {
  return data.reduce((acc, item) => {
    const date = item.startTime.split(" ")[0]; // 获取日期部分
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      startTime: item.startTime,
      endTime: item.endTime,
    });
    return acc;
  }, {});
};

const data = transformData(rawData);

// console.log("data", data);

const config = {
  container: document.getElementById("timeSlider"),
  curDay: "2025-03-19",
  flag: "__4f8fbfb",
  theme: "light-theme",
  styles: {
    emptyHeight: "100px",
    scrollHeight: "100px",
  },
  dbClick: (data) => {
    console.log("data", data);
  },
  rtClick: ({ time, event }) => {
    console.log(`右键录像段：${time}`);
    console.log("event", event);
  },
  download: ({ info, event }) => {
    console.log("下载按钮被点击", info);
    // 在这里处理下载逻辑
  },
  // data: [],
  data: demoData,
};

// 初始化时间轴组件
const timeline = new ihm_TimeSlider(config);

// 亮色模式按钮
window.lightBtnFunc = () => {
  document.body.classList.remove("dark-theme");
  document.body.classList.add("light-theme");
  // 更新时间轴的主题
  timeline.setTheme("light-theme");
};

// 暗色模式按钮
window.darkBtnFunc = () => {
  document.body.classList.remove("light-theme");
  document.body.classList.add("dark-theme");
  // 更新时间轴的主题
  timeline.setTheme("dark-theme");
};
