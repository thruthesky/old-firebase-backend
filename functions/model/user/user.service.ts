import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';



import { SECRET_KEY_PATH, PROFILE_PATH, PROFILE_KEY } from './../../define';

import { randomString } from './../../library';


// export interface USER_REGISTER {
//     email: string;
//     password: string;
//     displayName: string;
//     photoUrl: string;
// }

// export interface USER_REGISTER_RESONSE {
// }


export interface SOCIAL_PROFILE {
    providerId: string;
    name: string;               // displayName
    uid: string;
    email: string;
    password?: string;
    photoURL: string;
}



@Injectable()
export class UserService {
    auth: firebase.auth.Auth;
    private _isAdmin: boolean = false;
    root: firebase.database.Reference;
    secretKey: string;
    constructor(
        private angularFireAuth: AngularFireAuth,
        private angularFireDatabase: AngularFireDatabase

    ) {

        this.root = angularFireDatabase.database.ref('/');
        this.auth = angularFireAuth.auth;

        /**
         * For admin check.
         */
        this.auth.onAuthStateChanged((user: firebase.User) => {
            console.log("UserService::onAuthStateChanged()");
            if (user) {
                console.log("User logged in");
                this.getOrGenerateSecretKey(key => {
                    console.log("Got Secret Key: ", key);
                    this.secretKey = key;
                });
                this.loadProfile();
            }
            else {
                console.log("User logged out");
            }
            this.checkAdmin();
        });


    }


    /**
     * GETTERS
     */
    get uid() {
        if (this.isLogged) return this.auth.currentUser.uid;
    }
    get key() {
        return this.uid;
    }
    /**
     * @return null if there is no name.
     *          else user name.
     */
    get name() {
        if (this.isLogged) {
            let profile = this.getProfile();
            if ( ! profile['name'] ) return null; // if not exists.
            let name = profile['name'];
            if ( ! name ) return null; // exists but if 'undefined' or empty.
            else return name;
        }
        return null;
    }

    loadProfile() {
        return this.root.child(PROFILE_PATH).child(this.uid).once('value')
            .then( snap => {
                let profile = snap.val();
                if ( profile ) localStorage.setItem( PROFILE_KEY, JSON.stringify( profile ) );
                else '';
            })
            .catch( e => console.error( e ) );
    }

    getProfile() {
        let re = localStorage.getItem( PROFILE_KEY );
        if ( re ) {
            try {
                let profile = JSON.parse( re );
                return profile;
            }
            catch (e) {
                console.error(e);
            }
        }
    }


    /// eo GETTERS

    /**
     * 
     * @param data 
     */
    // create(data: USER_REGISTER): Promise<firebase.User> {
    //     return <Promise<firebase.User>><any>this.auth.createUserWithEmailAndPassword(data.email, data.password);
    // }

    // update(user: firebase.User, data: USER_REGISTER ) : firebase.Promise<void> {
    //     return user.updateProfile({
    //                 displayName: data.displayName,
    //                 photoURL: data.photoUrl
    //             });
    // }


    /**
     * 
     * @note Callback style function
     * 
     * @param data - user registration data.
     * @param success 
     * @param error 
     */
    // register( data: USER_REGISTER, success, error ) {

    //     this.create( data )
    //         .then( user => this.update( user, data ) )
    //         .then( success )
    //         .catch( error );

    // }


    logout() {
        this.auth.signOut().then(() => {
            console.log("sign out ok");
        }, () => {
            console.log("sing out error");
        });
    }



    /**
     * 
     */
    get isLogged(): boolean {
        if (this.auth.currentUser === void 0) return false;
        return this.auth.currentUser !== null;
    }

    get isAdmin(): boolean {
        return this._isAdmin;
    }


    /**
     * checks if the logged in user is admin.
     */
    checkAdmin() {
        if (!this.isLogged) {
            console.log("checkAdmin() not logged");
            this._isAdmin = false;
            return;
        }

        // console.log("Admin check");
        this.root.child('admin').child(this.uid).once('value').then(s => {
            let re = s.val();
            console.log(`${this.uid} is admin ? ${re}`);
            if (re === true) this._isAdmin = true;
        });
    }




    /**
     * After login, the user would get or generate secret key.
     * @note if there is no secret key, then create one.
     */
    getOrGenerateSecretKey(callback) {
        console.log("getSecretKey()");
        let key = this.root.child('user').child('secret').child(this.key);
        key.once('value')
            .then(snap => {
                if (snap.val()) {
                    console.log("Got secret key: ", snap.val());
                    callback(snap.val())
                }
                else {
                    let unique = randomString(this.uid);
                    console.log("secret key does not exists. generate: ", unique);
                    key.set(unique);
                    callback(unique);
                }
            })
            .catch(e => console.error(e));
    }




    updateProfile(user: SOCIAL_PROFILE, callback) {
        delete user.password;
        this.root.child(PROFILE_PATH).child(this.uid).set(user)
            .then(callback)
            .catch(e => console.error(e));
    }


}