const { Connection, Request, TYPES } = require('tedious');
const connectionProps = {
	server: '172.16.3.102',
	authentication: {
		type: 'default',
		options: {
			userName: 'sa',
			password: 'P@$$w0rd'
		}
	},
	options: {
		database: 'SalaryDB',
		encrypt: false,
		rowCollectionOnRequestCompletion: true,
		trustServerCertificate: true
	}
}

const fun = (action, people, callback) => {
	let res = []
	const connection = new Connection(connectionProps);
	let requestProc = ''
	if (action === 'notification') {
		requestProc = '[dbo].[notifications_proc]'
	}
	else if (action === 'message') {

	}
	const rows = people.map(person => [person])
	var table = {
		columns: [
			{ name: 'user_id', type: TYPES.Int },
		],
		rows: rows
	};

	connection.on('connect', function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log('Connected');
			const request = new Request('[dbo].[notifications_proc]', (error, rowCount, rows) => {
				if (error) console.log(error)
				else {
					let result = []
					rows.map(row => {
						let obj = []
						row.map(column => {
							obj = { ...obj, [column.metadata.colName]: column.value }
						})
						result = [...result, obj]
					})
					res = result;
				}
			});
			request.addParameter('user_ids', TYPES.TVP, table);
			request.on('requestCompleted', () => {
				connection.close();
				console.log('connection closed');
				// console.log(res);
				callback(JSON.stringify(res))
			})
			connection.callProcedure(request);
		}
	});
}
// export default fun
module.exports = fun

// fun('notification', 202, (a) => console.log(a))