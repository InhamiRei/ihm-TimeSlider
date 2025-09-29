import { rawData, rawData2 } from "./rawData.js";
import ihm_TimeSlider from "../components/TimeSlider.js";

// 处理rawData数据的方法，支持跨天处理
const transformData = (data) => {
  return data.reduce((acc, item) => {
    const startDate = item.startTime.split(" ")[0]; // 获取开始日期
    const endDate = item.endTime.split(" ")[0]; // 获取结束日期

    // 如果开始日期和结束日期相同，不需要分割
    if (startDate === endDate) {
      if (!acc[startDate]) {
        acc[startDate] = [];
      }
      acc[startDate].push({
        startTime: item.startTime,
        endTime: item.endTime,
      });
    } else {
      // 跨天情况，需要分割
      // 处理第一天（从开始时间到当天结束23:59:59）
      if (!acc[startDate]) {
        acc[startDate] = [];
      }
      acc[startDate].push({
        startTime: item.startTime,
        endTime: `${startDate} 23:59:59`,
      });

      // 处理第二天（从00:00:00到结束时间）
      if (!acc[endDate]) {
        acc[endDate] = [];
      }
      acc[endDate].push({
        startTime: `${endDate} 00:00:00`,
        endTime: item.endTime,
      });
    }

    return acc;
  }, {});
};

const data = [
  {
    id: "1602",
    name: "宇视NVR225通道01",
    extInfo: {
      id: "1602",
      channelCode: "00000000001181000144",
      deviceCode: "00000000001181000150",
      name: "宇视NVR225通道01",
      storageType: 0,
      cameraType: 1,
      recordType: 2,
      startTime: "2025-07-31 10:36:44",
      endTime: "2025-08-01 10:36:44",
    },
    ...transformData(rawData),
  },
  {
    id: "431",
    name: "宇视NVR225通道01",
    extInfo: {
      id: "431",
      channelCode: "00000000001181000144",
      deviceCode: "00000000001181000150",
      name: "宇视NVR225通道01",
      storageType: 0,
      cameraType: 1,
      recordType: 2,
      startTime: "2025-07-31 10:36:44",
      endTime: "2025-08-01 10:36:44",
    },
    ...transformData(rawData2),
  },
];

console.log("data", data);

// 配置项
const config = {
  container: document.getElementById("timeSlider"),
  curDay: "2025-09-09",
  flag: "__4f8fbfb",
  theme: "light-theme",
  showDownloadBtn: false,
  showMarkerLine: true, // 确保显示刻度线
  styles: {
    emptySize: "80px",
    scrollHeight: "100px",
    iconWidth: "1.1429rem",
    iconHeight: "1.1429rem",
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
  data: data,
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

// 获取时间轴信息
window.getTimeLineInfo = () => {
  const info = timeline.getInfo();
  console.log("info", info);
};

// 设置播放倍速
window.setPlaybackSpeed = (speed, trackIndex) => {
  timeline.setPlaybackSpeed(speed, trackIndex);
  console.log(`播放倍速已设置为 ${speed}x`);
};

// 定位刻度线到指定时间
window.seekToTime = (time, trackIndex) => {
  timeline.seekToTime(time, trackIndex);
  console.log(`刻度线已定位到 ${time}`);
};

// 根据轨道选择器定位到指定时间
window.seekToTimeWithTrack = (time) => {
  const trackSelector = document.getElementById("trackSelector");
  const selectedTrack = trackSelector.value;

  if (selectedTrack === "all") {
    timeline.seekToTime(time);
    console.log(`所有轨道的刻度线已定位到 ${time}`);
  } else {
    const trackIndex = parseInt(selectedTrack, 10);
    timeline.seekToTime(time, trackIndex);
    console.log(`第${trackIndex + 1}条轨道的刻度线已定位到 ${time}`);
  }
};
