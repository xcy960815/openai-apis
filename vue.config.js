const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    historyApiFallback: true,
    allowedHosts: 'all',
    // https: true,
    // proxy: {
    //   "/api": {
    //     // target: "http://aigateway.***.net",
    //     // target:"https://api.openai.com",
    //     changOrigin: true,   //如果接口跨域这里就要这个参数配置
    //     pathRewrite: {
    //       //'^/api': '/api'  //实际请求地址是http://baidu.com/api/news/list
    //       '^/api': ''  //实际请求地址是http://baidu.com/news/list
    //     }
    //   }
    // }
  },

  pages: {
    // 配置多页面入口
    index: {
      entry: 'example/main.ts',
      // 当有多行时，vue以最后一行entry为准。
      template: 'example/index.html',
    },
  },
});
