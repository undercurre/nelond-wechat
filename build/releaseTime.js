const fs = require('fs') //引入nodejs fs文件模块
const dayjs = require('dayjs')

const path = `${process.cwd()}\\src\\meta.ts`
const datetime = dayjs().format('YYYY-MM-DD HH:mm:ss')
const str = `export default ${JSON.stringify({ datetime }, null, 2)}`

// 写文件
fs.writeFileSync(path, str)
