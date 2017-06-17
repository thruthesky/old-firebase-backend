"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var functions = require("firebase-functions");
var admin = require("firebase-admin");
var corsOptions = require("cors");
var test_service_key_1 = require("./etc/test-service-key");
var forum_1 = require("./model/forum/forum");
var cors = corsOptions({ origin: true });
var app = admin.initializeApp({
    credential: admin.credential.cert(test_service_key_1.default),
    databaseURL: "https://test-ec3e3.firebaseio.com"
});
var db = app.database();
exports.postApi = functions.https.onRequest(function (req, res) {
    cors(req, res, function () {
        console.log("postApi() begins!");
        var forum = new forum_1.Forum(db.ref('/'));
        forum.postApi(req.body)
            .then(function (x) { return res.send({ code: 0, data: x }); })
            .catch(function (e) { return res.send({ code: e.message, message: forum.getLastErrorMessage }); });
        console.log("Send");
    });
});
//# sourceMappingURL=index.js.map