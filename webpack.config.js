// 引入 Node.js 自带的 path 模块，用于解析文件和目录路径
const path = require("path");
const fs = require("fs");
const MoveFilePlugin = require("./scripts/moveFilePlugin");

// 获取最新版本号
const getLatestVersion = () => {
  const logsDir = path.join(__dirname, "logs");
  const versionFiles = fs
    .readdirSync(logsDir)
    .filter((file) => file.startsWith("v") && file.endsWith(".md"))
    .sort()
    .reverse();

  if (versionFiles.length > 0) {
    return versionFiles[0].replace(".md", "").substring(1);
  }
  return "1.0.0"; // 默认版本
};

// 获取格式化的时间戳 (YYYYMMDDHHmm)
const getFormattedTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}`;
};

const version = getLatestVersion();
const timestamp = getFormattedTimestamp();

// 自定义模块
module.exports = {
  // 设置 webpack 的模式为生产模式 (production)，会启用优化功能，如压缩代码
  mode: "production",
  devServer: {
    // 指定本地服务器的内容目录为 ./build
    contentBase: "./build",
    port: 9001,
    // 启动服务器时自动打开浏览器
    open: true,
  },
  // 定义入口文件，指定项目的主入口
  entry: {
    esm: "./src/index.js",
    main: "./src/index.js",
    // [`argesTimeLine-v${version}-${timestamp}`]: "./src/index.js",
  },
  // 定义输出文件的配置
  output: {
    // 导出一个库名为 createPoster 的库
    library: "createPoster",
    // 配置库的输出格式为 UMD (Universal Module Definition)，兼容 CommonJS、AMD 和浏览器全局变量
    libraryTarget: "umd",
    // 指定导出的内容为模块的 default 属性（可以改为具体值，如 webpackDemo）
    libraryExport: "default",
    // 指定输出文件的路径为当前目录下的 dist 文件夹，使用 path 模块解析路径
    path: path.resolve(__dirname, "dist"),
    // 设置输出的文件名为入口名（如 main.js 和 esm.js）
    filename: "[name].js",
  },
  // 定义模块的处理规则
  module: {
    // 定义多个处理规则的数组
    rules: [
      {
        // 匹配所有 .png、.jpg 和 .gif 格式的文件
        test: /\.(png|jpg|gif)$/,
        // 使用的加载器列表
        use: [
          {
            // 使用 url-loader 处理匹配的图片文件
            loader: "url-loader",
            // 配置 url-loader 的选项
            options: {
              // 禁用 ES 模块规范（解决图片路径问题）
              esModule: false,
              // 小于 20 字节的图片会被转为 base64 内联在代码中，大于则输出为单独文件
              limit: 20,
            },
          },
        ],
      },
      {
        // 匹配 .css 文件（忽略大小写）
        test: /\.css$/i,
        // 使用 style-loader 和 css-loader 加载和解析 CSS 文件
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  // 配置插件列表
  plugins: [new MoveFilePlugin(version, timestamp)],
};
