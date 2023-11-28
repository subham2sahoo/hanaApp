const cds = require("@sap/cds");
module.exports = (srv) => {
    srv.on("srv", async (req) => {
        if (req.data.FLAG === "getData") {
            try {
                const data =require('./data.json');
                return JSON.stringify(data);

            } catch (e) {
                throw e;
            }
        }
    });


};