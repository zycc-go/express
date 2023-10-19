const fs = require('fs')

const errFile = (txt = '') => {
  const date = new Date()
  const fileName = date.toLocaleDateString()
  const str = `${date.toLocaleString()}   ${txt}\n`
  fs.appendFileSync(`../log/${fileName}`, str, 'utf-8')
}

module.exports = {
  errFile
}