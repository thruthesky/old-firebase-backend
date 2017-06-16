import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as corsOptions from 'cors';

import serviceAccount from "./etc/test-service-key";
import { Forum } from './model/forum/forum';

const cors = corsOptions({ origin: true });

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-ec3e3.firebaseio.com"
});
const db = app.database();

exports.postApi = functions.https.onRequest((req, res) => {

  cors(req, res, () => {
    console.log("postApi() begins...");
    let forum = new Forum(db.ref('/'));
    //res.send( JSON.stringify( req.body ) + JSON.stringify( req.params ) + JSON.stringify( req.query ) );
    forum.postApi(req.query)
      .then(x => res.send(x))
      .catch(e => res.send({ error: e.message }));
    console.log("Send");
  });

});


