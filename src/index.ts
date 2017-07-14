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
import { Forum } from './model/forum/forum';
import { ERROR } from './model/error/error';


const cors = corsOptions({ origin: true });

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com"
});
const db = app.database();

exports.api = functions.https.onRequest((req, res) => {

  cors(req, res, () => {
    //console.log("postApi() begins!");

    /// check function.
    /// @todo move it to base::checkRequestFunction();
    if ( req.body === void 0 || req.body.function === void 0 ) return this.error(ERROR.api_function_is_not_provided);
    let func: string = req.body.function;
    if (!func) return this.error(ERROR.api_function_name_is_empty);

    let taxonomy = null;
    if ( func.indexOf('.') > 0 ) {
      let arr = func.split('.');
      if ( arr[0] == 'forum' ) taxonomy =  new Forum();
      // else if ( arr[0] == 'advertisement' ) taxonomy = new Advertisement();
      else return ERROR.api_wrong_class_name;
    }
    else taxonomy = new Forum();

    taxonomy.setRoot(db.ref('/'));

    taxonomy.api(req.body)
      .then(x => res.send({ code: 0, data: x }))
      .catch(e => res.send({ code: e.message }));
    //console.log("postApi() end!");
  });
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
