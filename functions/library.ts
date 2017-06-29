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
    setSecretKey(uid: string): firebase.Promise<any> {
        let key = this.randomString(uid);
        console.log(`key: ${key} is going to be set`);
        return this.root.child(SECRET_KEY_PATH).child(uid).set(key)
            .then(() => key)
            //.catch(e => console.error(e));

    }


    generateSecretKey(uid: string): firebase.Promise<any> {
        //console.log(`generateSecretKey() for ${uid}`);
        return this.getSecretKey(uid)
            .then(key => {
                //console.log("generateSecretKey() => getSecretKey() ")
                if (key) return key;
                else {
                    //console.log(`key not exist. going to set`);
                    return this.setSecretKey(uid);
                }
            })
            // .catch(e => console.error(e));

        // let key = this.root.child(SECRET_KEY_PATH).child(uid);
        // key.once('value')
        //     .then(snap => {
        //         if (snap.val()) {
        //             console.log("Got secret key: ", snap.val());
        //             callback(snap.val())
        //         }
        //         else {
        //             let unique = randomString(this.uid);
        //             console.log("secret key does not exists. generate: ", unique);
        //             key.set(unique);
        //             callback(unique);
        //         }
        //     })
        //     .catch(e => console.error(e));
    }

}
