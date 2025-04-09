import { rawData, demoData } from "./rawData.js";
import ihm_TimeSlider from "../components/timeSlider.js";

// 处理rawData数据的方法
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
// 配置项
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

// 切换亮色模式和深色模式
window.changeTheme = (theme) => {
  if (theme === "light-theme") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    // 更新时间轴的主题
    timeline.setTheme("light-theme");
  } else if (theme === "dark-theme") {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    // 更新时间轴的主题
    timeline.setTheme("dark-theme");
  } else {
    return; // 不支持的主题，不做任何操作
  }
};

// 刻度线的操作
window.markLineOperate = (action) => {
  if (action === "resume") {
    timeline.resumeMarkLine();
  } else if (action === "stop") {
    timeline.stopMarkLine();
  } else {
    return; // 不支持的操作，不做任何操作
  }
};
