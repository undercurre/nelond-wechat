import { ossDomain } from './img'

/**
 * 隐私协议文档等配置文件
 */
export const DOC_List: IDoc[] = [
  {
    label: '隐私协议',
    url: `${ossDomain}/downloadFile/美的商照隐私协议.docx`,
    isShowLogin: true,
  },
  {
    label: '软件许可及用户服务协议',
    url: `${ossDomain}/downloadFile/软件许可及用户服务协议-美的商照.docx`,
    isShowLogin: true,
  },
  {
    label: '权限列表',
    url: `${ossDomain}/downloadFile/美的商照权限列表.xlsx`,
  },
  {
    label: '已收集个人信息清单',
    url: `${ossDomain}/downloadFile/已收集个人信息清单-美的商照.xlsx`,
  },
  {
    label: '第三方共享个人信息清单',
    url: `${ossDomain}/downloadFile/第三方共享个人信息清单-美的商照.xlsx`,
  },
]

interface IDoc {
  label: string // 文件名称
  url: string // 文件链接
  isShowLogin?: boolean // 是否在登录时展示，不设置则默认false
}
