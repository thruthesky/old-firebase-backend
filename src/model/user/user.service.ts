import { Injectable, NgZone } from '@angular/core';
import * as firebase from 'firebase';
// import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
// import 'rxjs/add/observable/fromPromise';
// import 'rxjs/add/observable/throw';

import { ERROR } from './../error/error';


import { SECRET_KEY_PATH, PROFILE_PATH, PROFILE_KEY } from './../../define';

import { Base } from './../base/base';


/**
 * This is user common data. This data structure has the same strcuture of database - /user/profile
 */
interface EMAIL {
    email: string;              // this cannot be optional.
}

interface PASSWORD {
    password: string;
}

interface USER_COMMON_DATA {
    providerId?: string;
    name?: string;              // displayName
    photoURL?: string;
    gender?: string;
    birthday?: string;
    mobile?: string;
}



export interface USER_REGISTER extends EMAIL, PASSWORD, USER_COMMON_DATA { }
export interface USER_UPDATE extends USER_COMMON_DATA { };

export interface SOCIAL_PROFILE extends EMAIL, USER_COMMON_DATA {
    uid: string;
    password?: string;
};

export interface PROFILE extends SOCIAL_PROFILE {};


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
    profile: USER_COMMON_DATA = <USER_COMMON_DATA>{};
    secretKey: string;
    /**
     * if user logged in, it will become 'login'.
     * if user logged out, it will become 'logout'.
     * if app does not know and try to get user login status, then it will become 'pending'.
     * By default ( initially ), it is pending (when the app is loaded for the first time )
     */
    // loginStatus: 'pending' | 'login' | 'logout' = 'pending';

    /**
     * getProfile() signaller.
     */
    loadProfile = new BehaviorSubject<boolean>(false);

    /**
     * 
     */
    constructor(
        private ngZone: NgZone
    ) {
        super();
        this.root = firebase.database().ref('/');
        this.auth = firebase.auth();

        /**
         * For login and admin check.
         */
        this.auth.onAuthStateChanged((user: firebase.User) => {
            // console.log("UserService::onAuthStateChanged()");
            if (user) {
                this.loginUser = user;
                // this.loginStatus = 'login'; /// this must come first before anything else.
                // console.log("UserService::onAuthStateChanged() => logged-in: ", user.uid);
                // console.log("loginStatus: ", this.loginStatus);

                this.getOrGenerateSecretKey()
                    .then(key => {
                        console.log("Got Secret Key: ", key);
                        this.secretKey = key;
                    })
                    .catch(e => console.error(e));
                // this.loadProfile(() => { }, e => console.error(e));
                this.getProfile().catch(e => console.error(e));
            }
            else {
                this.loginUser = null;
                // this.loginStatus = 'logout';
                console.log("UserService::onAuthStateChanged() => logged-out");
                this.profile = {};
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
    
    


    /// eo GETTERS

    /**
     * 
     * Registers with email/password and sets user profile data.
     * 
     * @note This sets loginUser
     * @param data User registration data
     * @return a promise with uid.
     * @example @see test code.
     */
    register(data: USER_REGISTER): firebase.Promise<any> {


        // return Promise.resolve(firebase.auth().createUserWithEmailAndPassword(data.email, data.password)).catch(e => console.log(e))

        console.log(data);

        if (!data['email']) return this.error(ERROR.register_email_is_empty);
        if (!data['password']) return this.error(ERROR.register_password_is_empty);
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
     * @note this is being called by register() and profile.ts
     *
     * 
     * @see readme#Profile
     * @param user 
     * @param callback Callback function
     * 
     * @code
     * @code
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
     * Gets logged user's profile data.
     * 
     * @see readme#getProfile
     * 
     * 
     */
    getProfile(): firebase.Promise<any> {
        if ( ! this.uid ) return this.error( ERROR.user_not_logged_in );
        return this.root.child(PROFILE_PATH).child(this.uid).once('value')
            .then(snap => {
                let profile = snap.val();
                if (!profile) profile = {};
                this.profile = profile;
                this.loadProfile.next( true );
                console.log("got profile: ", this.profile);
                /// Getting user profile data is changing the app's internal state. But the change does not update view immediately.
                /// So, it re-render Zone again.
                /// @note it may still take some time because of the handshaking between the app and firebase database for getting profile data.
                this.ngZone.run(() => { });
                return profile;
            });
    }

    /**
     * Return a promise with user profile.
     * @param uid User uid
     */
    getUserProfile( uid: string ) : firebase.Promise<any> {
        if ( ! this.uid ) return this.error( ERROR.uid_is_empty );
        return this.userProfile( uid ).once('value').then( snap => snap.val());
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