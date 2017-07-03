import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';

import { ERROR } from './../error/error';


import { SECRET_KEY_PATH, PROFILE_PATH, PROFILE_KEY } from './../../define';

import { Base } from './../base/base';





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
export class UserService extends Base {
    auth: firebase.auth.Auth;
    private _isAdmin: boolean = false;
    root: firebase.database.Reference;
    profile = null;
    secretKey: string;
    /**
     * if user logged in, it will become 'login'.
     * if user logged out, it will become 'logout'.
     * if app does not know and try to get user login status, then it will become 'pending'.
     * By default ( initially ), it is pending (when the app is loaded for the first time )
     */
    private loginStatus: 'pending' | 'login' | 'logout' = 'pending';
    constructor(
    ) {
        super();
        this.root = firebase.database().ref('/');
        this.auth = firebase.auth();



        /**
         * For login and admin check.
         */
        this.auth.onAuthStateChanged((user: firebase.User) => {
            console.log("UserService::onAuthStateChanged()");
            if (user) {
                this.loginStatus = 'login'; /// this must come first before anything else.
                console.log("UserService::onAuthStateChanged() => logged-in: ", user.uid);
                this.getOrGenerateSecretKey()
                    .then(key => {
                        console.log("Got Secret Key: ", key);
                        this.secretKey = key;
                    })
                    .catch(e => console.error(e));
                this.getProfile( p => this.profile = p, e => console.error(e) );
            }
            else {
                this.loginStatus = 'logout';
                console.log("UserService::onAuthStateChanged() => logged-out");
                this.profile = null;
            }
            this.checkAdmin();
        });

    }




    /**
     * Get a user's uid if he logged in.
     */
    get uid() {
        // console.log( 'uid() this.isLogged: ', this.isLogged);
        if (this.isLogin) return this.auth.currentUser.uid;
    }
    get key() {
        return this.uid;
    }
    /**
     * @return null if there is no name.
     *          else user name.
     */
    // get name() {
    //     if (this.isLogged) {
    //         let profile = this.getProfile();
    //         if ( ! profile ) return null;
    //         if (!profile['name']) return null; // if not exists.
    //         let name = profile['name'];
    //         if (!name) return null; // exists but if 'undefined' or empty.
    //         else return name;
    //     }
    //     return null;
    // }



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
    // get isLogged(): boolean {
    //     // console.log(`isLogged(). this.loginStatus==${this.loginStatus}`);

    // }

    get logged(): boolean {
        return this.isLogin;
    }
    /**
     * Returns true when the user logged out.
     * 
     * @attention the user has logged out.
     * 
     * 
     */
    get isLogout(): boolean {
        return this.loginStatus == 'logout';
    }

    get isLogin(): boolean {
        if (this.loginStatus == 'login') {
            if (this.auth.currentUser === void 0) return false;
            else return !!this.auth.currentUser;
        }
        else return false;
    }

    /**
     * Is the user not logged in? and Is the user is not logged out?
     */
    get isPending(): boolean {
        return this.loginStatus == 'pending';
    }



    get isAdmin(): boolean {
        return this._isAdmin;
    }
    get admin(): boolean {
        return this.isAdmin;
    }


    /**
     * checks if the logged in user is admin.
     */
    checkAdmin() {
        if (!this.isLogin) {
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
     * @see readme#Security
     * 
     * After login, the user would get or generate secret key.
     * @note if there is no secret key, then create one.
     * 
     */
    getOrGenerateSecretKey(): firebase.Promise<any> {
        return this.generateSecretKey(this.uid);
    }








    login(email: string, password: string): firebase.Promise<any> {
        return firebase.auth().signInWithEmailAndPassword(email, password);
    }

    register(email: string, password: string): firebase.Promise<any> {
        return firebase.auth().createUserWithEmailAndPassword(email, password)
    }



    /**
     * It updates user prifle.
     * 
     * @note it does not set whole profile. It only updates partly.
     * 
     * @see readme#Profile
     * @param user 
     * @param callback Callback function
     */
    updateProfile(profileData): firebase.Promise<any> {
        // console.log("Going to update user profile: user logged? ", this.isLogin);
        if (profileData.password !== void 0) delete profileData.password;
        profileData = this.trimObject(profileData);
        return this.root.child(PROFILE_PATH).child(this.uid).update(profileData);
    }



    /**
     * This is OLD Version
     * @see README#getProfile
     */
    // private getProfileCount = 0;
    // getProfile(success: (profile) => void, error?: (e) => void): void {
    //     console.log(`getProfile()`)
    //     if (this.isLogout) return error(ERROR.user_logged_out);
    //     else if (this.isLogin) {
    //         console.log('if isLogged')
    //         if (this.profile) return success(this.profile);
    //         else console.log('Going to load profile')
    //         this.root.child(PROFILE_PATH).child(this.uid).once('value')
    //             .then(snap => {
    //                 this.profile = snap.val();
    //                 if (!this.profile) this.profile = {};
    //                 success(this.profile);
    //             })
    //             .catch(error);
    //     }
    //     else { // pending ...
    //         console.log(`Waiting for login to get profile data: ${this.getProfileCount}`);
    //         if (this.getProfileCount++ > 100) return error(ERROR.timeout);
    //         else setTimeout(() => this.getProfile(success, error), 200);
    //     }
    // }


    /**
     * @code
     * 
                this.getProfile()
                    .then(profile => this.profile)
                    .catch(e => console.error(e));

     * @endcode
     */
    // getProfile(): firebase.Promise<any> {
    //     if ( this.isLogout ) return firebase.Promise.reject( new Error ( ERROR.user_logged_out ) );
    //     return this.root.child(PROFILE_PATH).child(this.uid).once('value')
    //         .then(snap => {
    //             let profile = snap.val();
    //             if (!profile) profile = {};
    //             return profile;
    //         });
    // }


    /**
     * This works as callback since firebase.auth.onAuthStateChanged() is not based on promise.
     */
    getProfile(success: (profile) => void, error: (e) => void): void {
        this.auth.onAuthStateChanged(user => {
            if (user) {
                return this.root.child(PROFILE_PATH).child(user.uid).once('value')
                    .then(snap => {
                        let profile = snap.val();
                        if (!profile) profile = {};
                        success(profile);
                    }, e => error(e));
            }
            else error(new Error(ERROR.user_not_logged_in));
        }, e => error(e));
    }


    /**
     * 
     * @see #Login Status
     * 
     * @param loginCallback 
     * @param logoutCallback 
     * @param errorCallback 
     */
    checkLogin(loginCallback: (uid: string) => void, logoutCallback?, errorCallback?: (e) => void) {
        this.auth.onAuthStateChanged((user: firebase.User) => {
            if (user) {
                loginCallback(user.uid);
            }
            else {
                if (logoutCallback) logoutCallback();
            }
        }, e => {
            if (errorCallback) errorCallback(e);
        });
    }





    /**
     * Save user's profile into memory because app may do template binding and access profile data too much.
     * 
     * @param profile user profile data.
     */
    // saveProfile( profile ) {
    //     this.profile = profile;
    //     // localStorage.setItem(PROFILE_KEY, JSON.stringify( profile ));
    // }
    // delete user's profile
    // deleteProfile() {
    //     this.profile = null;
    //     // localStorage.removeItem(PROFILE_KEY);
    // }

    /**
     * Gets user profile data from cache.
     * The profile data is being download and saved into cache every time the user logs in/refreshes page.
     */
    // getProfile() {
    //     if ( this.isLogged ) return this.profile;
    //     else return null;

    //     // let re = localStorage.getItem(PROFILE_KEY);
    //     // if (re) {
    //     //     try {
    //     //         let profile = JSON.parse(re);
    //     //         return profile;
    //     //     }
    //     //     catch (e) {
    //     //         console.error(e);
    //     //     }
    //     // }
    // }

}