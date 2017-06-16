import * as admin from 'firebase-admin';
import serviceAccount from "./etc/test-service-key";
import { Forum } from './model/forum/forum';

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-ec3e3.firebaseio.com"
});
const db = app.database();
exports.postApi = (req, res) => {
    console.log("postApi() begins...");
    let forum = new Forum( db.ref('/') );
    forum.postApi( req.body )
      .then( x => res.send(x) )
      .catch( e => res.send( e.message ) );
    console.log("Send");
}

