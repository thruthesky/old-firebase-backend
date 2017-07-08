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

exports.api = functions.https.onRequest((req, res) => {

  cors(req, res, () => {
    console.log("postApi() begins!");
    let forum = (new Forum()).setRoot(db.ref('/'));
    forum.api(req.body)
      .then(x => res.send({ code: 0, data: x }))
      .catch(e => res.send({ code: e.message, message: forum.getLastErrorMessage }));
    console.log("postApi() end!");
  });

});



exports.postSeo = functions.https.onRequest((req, res) => {
  let forum = (new Forum()).setRoot(db.ref('/'));
  forum.seo( req.path )
    .then( html => res.status(200).send( html ) )
    .catch( e => console.log(`ERROR: forum.seo(${req.path}) : ${e.message}`));
});
