// rawData 是原始数据
// demoData 是已经处理好的数据，用于展示

export const rawData = [
  {
    fileName: "+0+0+1757314720+1757347553+0",
    fileSize: "0",
    recordType: 0,
    fileCode: "+0+0+1757314720+1757347553+0",
    startTime: "2025-09-08 14:58:40",
    endTime: "2025-09-09 00:05:53",
  },
  {
    fileName: "+0+0+1757347624+1757493260+0",
    fileSize: "0",
    recordType: 0,
    fileCode: "+0+0+1757347624+1757493260+0",
    startTime: "2025-09-09 00:07:04",
    endTime: "2025-09-10 16:34:20",
  },
];

export const demoData = [
  {
    id: "1602",
    name: "宇视NVR225通道01",
    result: 2,
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
    "2025-07-31": [
      {
        startTime: "2025-07-31 10:36:44",
        endTime: "2025-08-01 00:07:52",
      },
    ],
    "2025-08-01": [
      {
        startTime: "2025-08-01 00:09:01",
        endTime: "2025-08-01 10:36:44",
      },
    ],
    queryStartTime: 1753929404,
    queryEndTime: 1754015804,
    strGaCode: "00000000001181000144",
    strName: "宇视NVR225通道01",
    vRecordTime: [
      {
        fileName: "E1753978072",
        fileSize: "0",
        startTime: "2025-07-31 10:36:44",
        endTime: "2025-08-01 00:07:52",
        storageType: 0,
        nBeginTime: 1753929404,
        nEndTime: 1753978072,
        nFileSize: "0",
      },
      {
        fileName: "E1754015804",
        fileSize: "0",
        startTime: "2025-08-01 00:09:01",
        endTime: "2025-08-01 10:36:44",
        storageType: 0,
        nBeginTime: 1753978141,
        nEndTime: 1754015804,
        nFileSize: "0",
      },
    ],
  },
  {
    id: "1612",
    name: "宇视NVR通道02",
    result: 2,
    extInfo: {
      id: "1612",
      channelCode: "00000000001181000145",
      deviceCode: "00000000001181000150",
      name: "宇视NVR通道02",
      storageType: 0,
      cameraType: 1,
      recordType: 2,
      startTime: "2025-07-31 10:36:44",
      endTime: "2025-08-01 10:36:44",
    },
    "2025-07-31": [
      {
        startTime: "2025-07-31 10:36:44",
        endTime: "2025-08-01 10:36:44",
      },
    ],
    queryStartTime: 1753929404,
    queryEndTime: 1754015804,
    strGaCode: "00000000001181000145",
    strName: "宇视NVR通道02",
    vRecordTime: [
      {
        fileName: "E1754015804",
        fileSize: "0",
        startTime: "2025-07-31 10:36:44",
        endTime: "2025-08-01 10:36:44",
        storageType: 0,
        nBeginTime: 1753929404,
        nEndTime: 1754015804,
        nFileSize: "0",
      },
    ],
  },
];
