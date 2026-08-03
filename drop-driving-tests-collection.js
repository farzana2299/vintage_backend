require('dotenv').config()
const mongoose = require('mongoose')

async function run() {
	await mongoose.connect(process.env.BASE_URL)
	console.log('Connected')

	const collections = await mongoose.connection.db.listCollections({ name: 'drivingtests' }).toArray()

	if (collections.length === 0) {
		console.log('No drivingtests collection found, nothing to do')
	} else {
		await mongoose.connection.db.dropCollection('drivingtests')
		console.log('Dropped drivingtests collection')
	}

	await mongoose.disconnect()
	console.log('Done')
}

run().catch((err) => {
	console.error('Failed:', err)
	process.exit(1)
})
