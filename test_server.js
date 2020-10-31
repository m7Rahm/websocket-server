const { ConnectionPool, CPRequest } = require('./connection-pool')
const { TYPES } = require('tedious')

const poolOptions = {
    log: true,
    max: 6
}
const connectionOptions = {
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
const pool = new ConnectionPool(poolOptions, connectionOptions);

pool.newRequest(props => {
    const request = new CPRequest('procurement_get_orders_list', (err, rowCount, row) => {
    }, props);
    const rows = []
    request.on('row', columns => {
        let row = {}
        columns.forEach(column => {
            row = { ...row, [column.metadata.colName]: column.value }
        })
        rows.push(row);
    });
    request.on('requestCompleted', () => console.log('rows ', rows));
    request.addParameter('row_start', TYPES.Int, 0);
    request.addParameter('row_end', TYPES.Int, 100);
    request.addParameter('user_id', TYPES.Int, 73);
    props.connection.callProcedure(request);
})
