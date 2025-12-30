const path = require('path');
const fs = require('fs');

class MoveFilePlugin {
  constructor(version, timestamp) {
    this.version = version;
    this.timestamp = timestamp;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('MoveFilePlugin', (compilation) => {
      const versionFile = `argesTimeLine-v${this.version}-${this.timestamp}.js`;
      const srcPath = path.join(process.cwd(), 'dist', versionFile);
      const destPath = path.join(process.cwd(), 'version', versionFile);

      if (!fs.existsSync(path.join(process.cwd(), 'version'))) {
        fs.mkdirSync(path.join(process.cwd(), 'version'));
      }

      if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
      }
    });
  }
}

module.exports = MoveFilePlugin;
