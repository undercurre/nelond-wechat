export const helpList = [
  {
    title: 'HOMLUX系统介绍',
    type: 'homLuxSystemHelp',
    url: '/homlux/book1/index.html',
  },
  {
    title: 'HOMLUX小程序用户指引',
    type: 'homLuxMPHelp',
    url: '/homlux/book2/index.html',
  },
  {
    title: '四寸屏用户指引',
    type: 'screenHelp',
    url: '/homlux/book3/index.html',
  },
  {
    title: '遥控器用户指引',
    type: 'remoterHelp',
  },
]

export const remoterHelp = `
<p style="font-size:16px;font-weight: 600; line-height: 2;">
1、 设备是否需要联网？
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
不需要，“遥控器”小程序通过蓝牙和设备近距离通信，设备不需要连接Wi-Fi。手机需要能联网才能加载“遥控器”小程序。
</p>

<p style="font-size:16px;font-weight: 600; line-height: 2;">
2、哪些型号的设备支持“遥控器”小程序？
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
美智以下型号（浴霸、吸顶灯）的产品已经支持“遥控器”小程序，更多型号逐步更新中。
</p>

<p style="font-size:16px;font-weight: 600; line-height: 2;">
3、如何搜索新设备？
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
给设备通电，将手机的蓝牙打开（首次进入小程序会提示获取蓝牙使用权限，可查看打开蓝牙的指引），打开“遥控器”小程序。将手机靠近待连接的设备，建议距离在2米以内，再点击“搜索新设备”。小程序会自动搜索附近的设备，若发现有新设备则在小程序顶部展示。点击新设备卡片页或者控制按钮即可完成新设备添加。
</p>

<p style="font-size:16px;font-weight: 600; line-height: 2;">
4、搜索不到新设备
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
首先确认设备是否通电，用自带遥控器或者线控器可验证设备是否工作正常；

其次确认手机蓝牙是否打开，若蓝牙没有打开则按照指引打开手机蓝牙；

最后确认手机距离与设备是否太远，蓝牙通信最大距离为8米，若在空旷环境下超过8米或者隔墙可能会导致搜索失败。
</p>

<p style="font-size:16px;font-weight: 600; line-height: 2;">
5、我的设备无法控制
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
首先确认设备是否通电，用自带遥控器或者线控器可验证设备是否工作正常；

其次确认手机蓝牙是否打开，若蓝牙没有打开则按照指引打开手机蓝牙；

最后确认手机距离与设备是否太远，蓝牙通信最大距离为8米，若在空旷环境下超过8米或者隔墙可能会导致控制失败。
</p>

<p style="font-size:16px;font-weight: 600; line-height: 2;">
6、我的设备消失不见了
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
“遥控器”小程序是本地记录设备信息，不会上传到云端。所以以下操作会导致已添加的设备消失：

A、 在“最近”中删除“遥控器”小程序

B、 在手机系统中或者微信中清除了缓存

C、 卸载了微信

若我的设备消失不见了，按照“如何搜索新设备”重新添加即可。
</p>

<p style="font-size:16px;font-weight: 600; line-height: 2;">
7、 小程序无响应或显示空白
</p>
<p style="font-size:14px;color: #555659; margin: 10px auto;">
可能由于手机网络问题导致小程序长时间加载无响应，请切换良好的手机网络，并点击小程序右上角“...”，在弹出选项中点击“重新进入小程序”。
</p>
`
