export default defineAppConfig({
  pages: [
    'pages/register/index',
    'pages/consultation/index',
    'pages/deal/index',
    'pages/commission/index',
    'pages/code/index',
    'pages/report/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#9B51E0',
    navigationBarTitleText: '医美达人佣金管理',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#9B51E0',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/register/index',
        text: '顾客登记'
      },
      {
        pagePath: 'pages/consultation/index',
        text: '面诊跟进'
      },
      {
        pagePath: 'pages/deal/index',
        text: '成交确认'
      },
      {
        pagePath: 'pages/commission/index',
        text: '佣金预估'
      },
      {
        pagePath: 'pages/code/index',
        text: '达人口令'
      },
      {
        pagePath: 'pages/report/index',
        text: '门店日报'
      }
    ]
  }
})
