/**
 * @file index.ts
 * @desc firebase cloud functions for sonub.com
 * 
 * 
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as corsOptions from 'cors';


import serviceAccount from "./etc/service-key";
import { BackendApi } from './model/api/backend';

import { Forum } from './model/forum/forum';



const cors = corsOptions({ origin: true });

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com"
});
const db = app.database();

exports.api = functions.https.onRequest((req, res) => {
  cors(req, res, () => new BackendApi(db, req, res) );
});


exports.postSeo = functions.https.onRequest((req, res) => {
  let forum = (new Forum()).setRoot(db.ref('/'));
  forum.seo( req.path )
    .then( html => res.status(200).send( html ) )
    .catch( e => {
       forum.getSeoHtml( null )
        .then( html => res.status(200).send( html ) );
      
    });
});
