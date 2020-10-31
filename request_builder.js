const { CPRequest } = require('./connection-pool');
const makeRequest = (sqlReq, callback, poolProps, params) => {
    const request = new CPRequest(sqlReq, (err, rowCount, rows) => {
        if (err)
            console.log(err);
        else {
            const result = rows.map(row => row.reduce((sum, current) => {
                return { ...sum, [current.metadata.colName]: current.value }
            }, {})
            );
            callback(result)
        }
    }, poolProps);
    params.map( param => request.addParameter(param.name, param.type, param.value))
    poolProps.connection.callProcedure(request)
}
module.exports = makeRequest