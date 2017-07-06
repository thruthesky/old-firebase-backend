import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';

import { ERROR } from './../error/error';


import { SECRET_KEY_PATH, PROFILE_PATH, PROFILE_KEY } from './../../define';

import { Base } from './../base/base';


/**
 * This is user common data. This data structure has the same strcuture of database - /user/profile
 */
interface USER_COMMON_DATA {
    providerId?: string;
    name: string;               // displayName
    email: string;
    photoURL?: string;
    gender?: string;
    birthday?: string;
    mobile?: string;
}

interface PASSWORD {
    password: string;
}


export interface USER_REGISTER extends USER_COMMON_DATA, PASSWORD { }
export interface USER_UPDATE extends USER_COMMON_DATA { };

export interface SOCIAL_PROFILE extends USER_COMMON_DATA {
    uid: string;
    password?: string;
}

@Injectable()
export class UserService extends Base {
    auth: firebase.auth.Auth;
    private _isAdmin: boolean = false;
    root: firebase.database.Reference;


    /**
     * @see #loginUser
     */
    loginUser: firebase.User | null = void 0;

    /**
     * User profile data
     */
    profile = null;
    secretKey: string;
    /**
     * if user logged in, it will become 'login'.
     * if user logged out, it will become 'logout'.
     * if app does not know and try to get user login status, then it will become 'pending'.
     * By default ( initially ), it is pending (when the app is loaded for the first time )
     */
    // loginStatus: 'pending' | 'login' | 'logout' = 'pending';
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
                this.loginUser = user;
                // this.loginStatus = 'login'; /// this must come first before anything else.
                console.log("UserService::onAuthStateChanged() => logged-in: ", user.uid);
                // console.log("loginStatus: ", this.loginStatus);

                this.getOrGenerateSecretKey()
                    .then(key => {
                        console.log("Got Secret Key: ", key);
                        this.secretKey = key;
                    })
                    .catch(e => console.error(e));
                this.loadProfile(() => { }, e => console.error(e));
            }
            else {
                this.loginUser = null;
                // this.loginStatus = 'logout';
                console.log("UserService::onAuthStateChanged() => logged-out");
                this.profile = null;
            }
            this.checkAdmin();
        });

    }


    /**
     * Sets loginUser and returns it.
     * @param user firebase.User
     * 
     * @code
     *      let user = this.app.user.setLoginUser( res.user );
     * @endcode
     * 
     */
    setLoginUser(user: firebase.User | null): firebase.User {
        this.loginUser = user;
        return this.loginUser;
    }


    /**
     * Get a user's uid if he logged in.
     */
    get uid() {
        // console.log( 'uid() this.isLogged: ', this.isLogged);
        if (this.loginUser) return this.loginUser.uid;
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
     * Registers with email/password and sets user profile data.
     * 
     * @note This sets loginUser
     * @param data User registration data
     * @return a promise with uid.
     * @example see test code.
     */
    register(data: USER_REGISTER): firebase.Promise<any> {


        // return Promise.resolve(firebase.auth().createUserWithEmailAndPassword(data.email, data.password)).catch(e => console.log(e))

        console.log(data);
        return this.auth.createUserWithEmailAndPassword(data.email, data.password)
            .then((user: firebase.User) => {
                this.setLoginUser(user);
                return this.updateProfile(data);
            })
            .then(() => {
                return this.uid;
            })
            .catch(e => {
                console.log("Caught in register: ", e['code'], e.message);
                switch (e['code']) {
                    case 'auth/weak-password': return this.error(ERROR.auth_weak_password);
                    case 'auth/email-already-in-use': return this.error(ERROR.auth_email_already_in_use);
                    case 'auth/invalid-email': return this.error(ERROR.auth_invalid_email);
                    case 'auth/operation-not-allowed': return this.error(ERROR.auth_operation_not_allowed);
                    default:
                        console.log(e);
                        if (e['message']) return this.error(e['message']);
                        else return this.error(ERROR.firebase_auth_unknown_error);
                }
            });

    }



    /**
     * 
     * 
     * @note This sets loginUser
     * 
     * @param email 
     * @param password
     * @return A promise with UserService.loginUser 
     */
    login(email: string, password: string): firebase.Promise<any> {
        return firebase.auth().signInWithEmailAndPassword(email, password)
            .then(user => this.setLoginUser(user));
    }

    // register(email: string, password: string): firebase.Promise<any> {
    //     return firebase.auth().createUserWithEmailAndPassword(email, password)
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


    /**
     * @note This does not set loginUser.
     * @note onAuthStateChanged() will set it.
     */
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
        return this.loginUser === null;
    }

    get isLogin(): boolean {
        return !!this.loginUser;

        // return this.loginStatus == 'login';
        //     if (this.loginStatus == 'login') {
        //         if (this.auth.currentUser === void 0) return false;
        //         else {
        //             if (this.auth.currentUser) {
        //                 //console.log("yes auth.currentUser has value");
        //                 return true;
        //             }
        //             else {
        //                 //console.log("No. currentUser is null");
        //                 return false;
        //             }
        //         }
        //     }
        //     else return false;
    }

    /**
     * Is the user not logged in? and Is the user is not logged out?
     */
    get isPending(): boolean {
        return this.loginUser === void 0;
        // return this.loginStatus == 'pending';
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








    /**
     * It updates user prifle.
     * 
     * @note it does not set whole profile. It only updates partly.
     * 
     *
     * 
     * @see readme#Profile
     * @param user 
     * @param callback Callback function
     */
    updateProfile(profileData): firebase.Promise<any> {
        // console.log("Going to update user profile: user logged? ", this.isLogin);
        let data = Object.assign({}, profileData);
        if (data.password !== void 0) delete data.password;
        data = this.trimObject(data);
        console.log("updateProfile of " + this.uid + ", with: ", data);
        return this.root.child(PROFILE_PATH).child(this.uid).update(data);
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
     * 
     * Loads a user profile data from database.
     *      - And set it to 'profile' class property.
     *      - And call 'success' callback with 'profile'.
     * 
     * @warning Admin may load other user's profile data. ( The profile data is protected by Rules, though. )
     * 
     * 
     * @attension Do not use this method in class component or template since it uses setTimeout() it is not a good one.
     * @note use loadProfile().
     * 
     * 
     * @code
                app.user.auth.onAuthStateChanged( user => {
                    app.user.loadProfile( user.uid ).then( p => this.profile = p );
                });
     * @endcode
     */
    private loadProfileCount = 0;
    loadProfile(success: (profile) => void, error: (e) => void): void {
        if (this.isPending) {
            console.log("getProfile() pending count: ", this.loadProfileCount);
            if (this.loadProfileCount++ > 200) return error(new Error(ERROR.timeout));
            else setTimeout(() => this.loadProfile(success, error), 100);
        }
        else {
            if (this.isLogin) {
                this.getProfile()
                    .then(p => {
                        this.profile = p;
                        success(p);
                    })
                    .catch(error);
            }
            else {
                error(new Error(ERROR.user_not_logged_in));
            }
        }
    }



    /**
     * Gets logged user's profile data.
     * 
     * 
     * @attention 'loginUser' must be set before this method.
     * 
     * @see readme#getProfile
     * 
     * 
     * @param success Success callback with profile data.
     * @param error Error call back with Error
     */
    getProfile(): firebase.Promise<any> {
        return this.root.child(PROFILE_PATH).child(this.uid).once('value')
            .then(snap => {
                let profile = snap.val();
                if (!profile) profile = {};
                return profile;
            });
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


}