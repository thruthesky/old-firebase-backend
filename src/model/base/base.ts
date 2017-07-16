import * as firebase from 'firebase';

import { SECRET_KEY_PATH, ERROR_INFO } from './../../interface';
import { ERROR } from './../error/error';


/**
 * This is not a service. You cannot inject.
 */
export class Base {
    public root: firebase.database.Reference
    constructor() {
    }


    /**
     * 
     * @see https://docs.google.com/document/d/1m3-wYZOaZQGbAzXeVlIpJNSdTIt3HCUiIt9UTmZUgXo/edit#heading=h.ogzu1hw0b96r
     * @param code Error code/message
     * @param extra Extra data to deliver to users.
     */
    error(code, extra?) {
        // if (extra) msg += `: ${extra}`;
        return firebase.Promise.reject(new Error(this.makeErrorString(code, extra)));
    }

    /**
     * It creates an error code.
     *          - if extra is empty, then code will be returned
     *          - or, 'code: extra' will be returned.
     * @note this error can be parsed by parseError()
     * @see https://docs.google.com/document/d/1m3-wYZOaZQGbAzXeVlIpJNSdTIt3HCUiIt9UTmZUgXo/edit#heading=h.ogzu1hw0b96r
     * @param code
     * @param extra 
     * @return string of error code.
     */
    makeErrorString(code, extra?): string {
        return extra ? code + ': ' + extra : code;
    }

    parseError(str): ERROR_INFO {
        if (!str) return { code: 'error-str-is-empty-in-errorInfo' };
        if (typeof str !== 'string') return { code: 'error-str-is-not-string-in-errorInfo' };
        if (str.indexOf(": ") == -1) return { code: str };
        let [code, ...extra] = str.split(": ");
        return {
            code: code,
            extra: extra.join(' ')
        };
    }

    /**
     * Returns error code from error object.
     * @note Error object must contain { code: string } or { message: string }
     * 
     * @param errorObject Error object.
     * 
     * @note if the error object is comming from Backend, it has { code: error-string }
     * @note if the error object is Javascript Error Object, it has { message: error-string }
     * 
     * @return null if there is no error code on error object.
     * 
     * 
     * @see https://docs.google.com/document/d/1m3-wYZOaZQGbAzXeVlIpJNSdTIt3HCUiIt9UTmZUgXo/edit#heading=h.ogzu1hw0b96r
     */
    getErrorCode(errorObject): string {
        if (!errorObject) return null;
        if (errorObject.code) return this.parseError(errorObject.code).code;
        else if (errorObject.message) return this.parseError(errorObject.message).code;
        return null;
    }
    /**
     * Alias of getErrorCode()
     * 
     * @see https://docs.google.com/document/d/1m3-wYZOaZQGbAzXeVlIpJNSdTIt3HCUiIt9UTmZUgXo/edit#heading=h.ogzu1hw0b96r
     * @param errorObject Alias of getErrorCode()
     */
    errcode(errorObject): string {
        return this.getErrorCode(errorObject);
    }
    /**
     * Returns error message from error object.
     * 
     * @see https://docs.google.com/document/d/1m3-wYZOaZQGbAzXeVlIpJNSdTIt3HCUiIt9UTmZUgXo/edit#heading=h.ogzu1hw0b96r
     * @param errorObject Error object.
     * 
     * 
     * 
     * @return null if there is no error message.
     */
    getErrorExtra(errorObject): string {
        if (this.getErrorCode(errorObject)) return this.parseError(errorObject.code).extra;
        else return null;
    }
    /**
     * Alias of getErrorMessage()
     * @see https://docs.google.com/document/d/1m3-wYZOaZQGbAzXeVlIpJNSdTIt3HCUiIt9UTmZUgXo/edit#heading=h.ogzu1hw0b96r
     * @param errorObject
     */
    errextra(errorObject): string {
        return this.getErrorExtra(errorObject);
    }

    throwError(e) {
        throw new Error(e);
    }


    /**
     * Sets database root reference
     * @param root Database reference of root ('/')
     * @code
     *          (new Forum()).setRoot(db.ref('/'));
     * @endcode
     */
    setRoot(root) {
        this.root = root;
        return this;
    }



    checkRequest(req) {
        let re = {
            error: null,
            className: null,
            methodName: null
        };

        if (req.body === void 0) {
            re.error = ERROR.requeset_is_empty;
            return re;
        }


        if (req.body.route === void 0) {
            console.log( req.body );
            re.error = ERROR.api_route_is_not_provided;
            return re;
        }

        let route: string = req.body.route;
        if (!route) {
            re.error = ERROR.api_route_name_is_empty;
            return re;
        }



        // uid
        // console.log("uid:", req['body'])
        if (!req['body']['uid']) {
            re.error = ERROR.uid_is_empty;
            return re;
        }
        if (this.checkKey(req['body']['uid'])) {
            re.error = ERROR.malformed_key;
            return re;
        }

        // secret
        if (!req['body']['secret']) {
            re.error = ERROR.secret_is_empty;
            return re;
        }


        let cf = this.getClassMethod(route);
        re.className = cf.className;
        re.methodName = cf.methodName;
        return re;

    }

    getClassMethod(route) {
        let re = {
            className: null,
            methodName: null
        };
        if (route.indexOf('.') > 0) {
            let arr = route.split('.');
            re.className = arr[0];
            re.methodName = arr[1];
        }
        else { /// for backward compatibility.
            re.className = 'forum';
            re.methodName = route;
        }
        return re;
    }






    /////// paths


    userProfile(uid): firebase.database.Reference {
        // if (this.isEmpty(uid)) return this.error( ERROR.uid_is_empty );
        return this.root.ref.child('user').child('profile').child(uid);
    }


    /**
     * Checks if the push key has in right form.
     * @param key The push key
     * @return true on error. false on success.
     */
    checkKey(key: string): boolean {
        if (key === void 0 || !key) return true;
        if (typeof key !== 'string') return true;
        // if (key.length != 21) return true; // key can be made by user.
        if (key.indexOf('#') != -1) return true;
        if (key.indexOf('/') != -1) return true;
        if (key.indexOf('.') != -1) return true;
        if (key.indexOf('[') != -1) return true;
        if (key.indexOf(']') != -1) return true;
        return false;
    }



    isEmpty(obj) {
        return obj === void 0 || !obj;
    }




    randomString(seed = '') {
        let d = new Date();
        let unique = seed + '-' + d.getTime() + '-';
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 8; i++) {
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
        if (!uid) return this.error(ERROR.uid_is_empty);
        console.log(`Base::getSecretKey() of ${uid}`);

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
        let secretkey = this.randomString(uid);
        console.log(`key: ${secretkey} is going to be set`);
        return this.root.child(SECRET_KEY_PATH).child(uid).set(secretkey)
            .then(() => secretkey)
        //.catch(e => console.error(e));

    }


    /**
     * If secure key exists, it just returns the key.
     *      - or it will generate new secure key.
     * @param uid user uid
     * 
     * @return a promise of secret key.
     * 
     * 
     */
    generateSecretKey(uid: string): firebase.Promise<any> {
        console.log(`Base::generateSecretKey() for uid: ${uid}`);
        if (!uid) return this.error(ERROR.uid_is_empty);
        return this.getSecretKey(uid)
            .then(secretkey => {
                // console.log("generateSecretKey() => getSecretKey() : ", secretkey);
                if (secretkey) return secretkey;
                else {
                    // console.log(`Secret key not exist. going to set`);
                    return this.setSecretKey(uid);
                }
            });
    }


}
