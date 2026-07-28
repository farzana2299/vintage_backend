const mongoose = require('mongoose')

mongoose
    .connect(process.env.BASE_URL)
    .then(() => {
        console.log('____Mongoose connected successfully_______')
    })
    .catch((err) => {
        console.log('........Error in mongoose connection', err.message)
    })