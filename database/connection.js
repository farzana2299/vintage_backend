const mongoose = require('mongoose')

mongoose
    .connect(process.env.BASE_URL)
    .then(() => {
        console.log('____Mongoose connected successfully_______')
    })
    .catch((err) => {
        console.error('........Error in mongoose connection', err.message)
        process.exit(1)
    })

mongoose.connection.on('error', (err) => {
    console.error('........Mongoose connection error', err.message)
})

mongoose.connection.on('disconnected', () => {
    console.error('........Mongoose connection lost')
})
