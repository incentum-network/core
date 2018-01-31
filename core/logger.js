const winston = require('winston')
require('winston-daily-rotate-file')
require('colors')

let logger = null

class Logger {
  constructor () {
    if (!logger) {
      logger = this
    }
    return logger
  }

  init (loglevel, filelevel, network) {
    const rotatetransport = new winston.transports.DailyRotateFile({
      filename: `${__dirname}/../logs/ark-node-${network}`,
      datePattern: '.yyyy-MM-dd.log',
      level: filelevel,
      zippedArchive: true
    })

    Object.assign(this, new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          level: loglevel,
          timestamp: true
        }),
        rotatetransport
      ]
    }))
    this.filters.push((level, msg, meta) => {
      if (this.tracker) {
        process.stdout.write('\u{1b}[0G                                                                                                     \u{1b}[0G')
        this.tracker = false
      }
      return msg
    })
  }

  printTracker (title, current, max, posttitle, figures = 0) {
    const progress = 100 * current / max
    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    const hundred = 100
    if (progress.toFixed(4) === hundred.toFixed(4)) line += '✔️                              \n'
    else {
      line += progress.toFixed(figures) + '% '
      if (posttitle) line += posttitle + '                     '
    }
    process.stdout.write(line)
    this.tracker = true
  }
}

module.exports = new Logger()
