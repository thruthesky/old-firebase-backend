import * as admin from 'firebase-admin';
import serviceAccount from "../test-service-key";
import { Forum } from '../firebase-cms/src/model/forum/forum';

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-ec3e3.firebaseio.com"
});
const db = app.database();
exports.helloApi = (req, res) => {
    console.log("Going to send Hello world message.");
    
    let forum = new Forum( db.ref('/') );

    // db.ref('/forum/category').once('value').then( s => {
    //     res.send( JSON.stringify( s.val() ));
    // });

    // forum.getCategories()
    //     .then( categories => {
    //         res.send( JSON.stringify( categories ) );
    //     });
    
    forum.getCategory( req.param('category') )
        .then( c => res.send( JSON.stringify(c) ) );

    console.log("Send");
}







