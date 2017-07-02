/**
 * Firebase Backend Library
 * 
 * This clss is utility library of firebase backend. What is does;
 * 
 *      - Provides basic functions
 *      - Firebase works like getting or setting data.
 * 
 * 
 * @code How to use
 *      class XXXX {
 *          lib;
 *          constructor() {
 *              this.lib = new Library( this.root );
 *          }
 *      }
 * @endcode
 * 
 * @code How to use on existing class
 * 
 *      this.user.lib.getSecretKey().then( key => key );
 * 
 * @endcode
 * 
 */

import * as firebase from 'firebase/app';
import { SECRET_KEY_PATH } from './define';

export class Library {
    constructor(
        private root: firebase.database.Reference
    ) {

    }
    randomString(seed = '') {
        let d = new Date();
        let unique = seed + '-' + d.getTime() + '-';
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 8; i++) {
            unique += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return unique;
    }


    /**
     * 
     * Turns undefined into null to avoid "first argument contains undefined in property of firebase" error.
     * 
     * @param obj 
     * 
     * @code
     *              data = this.lib.trimObject( data );
     * @endcode
     * 
     */
    trimObject(obj) {
        obj = JSON.parse(JSON.stringify(obj, function (k, v) {
            if (v === undefined) return null;
            else return v;
        }));
        return obj;
    }


    /**
     * 
     * Returns a promise of a secret key.
     * @param uid User uid.
     * @return null of promise if no secret key ( or not exsits ),
     *          or a string of promise with a secret key of the user.
     */
    getSecretKey(uid: string): firebase.Promise<any> {

        //
        
        //console.log(`Going to get key of ${uid}`);
        return this.root.child(SECRET_KEY_PATH).child(uid).once('value')
            .then(snap => {
                let v = snap.val();
                //console.log(`Got key of ${uid}: ${v}`)
                if (v) return v;
                else return null;
            })
            // .catch(e => {
            //     console.log(e);
            // });
    }


    /**
     * Sets a new secure key.
     */
    setSecretKey(uid: string): firebase.Promise<any> {
        let key = this.randomString(uid);
        console.log(`key: ${key} is going to be set`);
        return this.root.child(SECRET_KEY_PATH).child(uid).set(key)
            .then(() => key)
            //.catch(e => console.error(e));

    }


    /**
     * If secure key exists, it just returns the key.
     *      - or it will generate new secure key.
     * @param uid user uid
     */
    generateSecretKey(uid: string): firebase.Promise<any> {
        console.log(`generateSecretKey() for uid: ${uid}`);
        return this.getSecretKey(uid)
            .then(key => {
                console.log("generateSecretKey() => getSecretKey() : ", key);
                if (key) return key;
                else {
                    //console.log(`key not exist. going to set`);
                    return this.setSecretKey(uid);
                }
            })
    }

}
