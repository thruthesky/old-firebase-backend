import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as corsOptions from 'cors';

import serviceAccount from "./etc/service-key";
import { Forum } from './model/forum/forum';

const cors = corsOptions({ origin: true });

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com"
});
const db = app.database();

exports.postApi = functions.https.onRequest((req, res) => {

  cors(req, res, () => {
    console.log("postApi() begins!");
    let forum = new Forum(db.ref('/'));
    //res.send( JSON.stringify( req.body ) + JSON.stringify( req.params ) + JSON.stringify( req.query ) );
    forum.postApi(req.body)
      .then(x => res.send({code: 0, data: x}))
      .catch(e => res.send({ code: e.message, message: forum.getLastErrorMessage }));
    console.log("Send");
  });

});


