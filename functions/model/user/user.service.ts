import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';




export interface USER_REGISTER {
    email: string;
    password: string;
    displayName: string;
    photoUrl: string;
}

export interface USER_REGISTER_RESONSE {
}

@Injectable()
export class UserService {
    auth: firebase.auth.Auth;
    private _isAdmin: boolean = false;
    root: firebase.database.Reference;
    constructor(

        private angularFireAuth: AngularFireAuth,
        private angularFireDatabase: AngularFireDatabase

    ) {

        this.root = angularFireDatabase.database.ref('/');
        this.auth = angularFireAuth.auth;
        
        /**
         * For admin check.
         */
        this.auth.onAuthStateChanged( (user: firebase.User) => {
            console.log("Auth state changed");
            if ( user ) {
                console.log("User logged in");
            }
            else {
                console.log("User logged out");
            }
            this.checkAdmin();
        }, e => {

        });


    }

    /**
     * GETTERS
     */

     get uid() {
         if ( this.isLogged ) return this.auth.currentUser.uid;
     }

    /// eo GETTERS

    /**
     * 
     * @param data 
     */
    create(data: USER_REGISTER): Promise<firebase.User> {
        return <Promise<firebase.User>><any>this.auth.createUserWithEmailAndPassword(data.email, data.password);
    }

    update(user: firebase.User, data: USER_REGISTER ) : firebase.Promise<void> {
        return user.updateProfile({
                    displayName: data.displayName,
                    photoURL: data.photoUrl
                });
    }


    /**
     * 
     * @note Callback style function
     * 
     * @param data - user registration data.
     * @param success 
     * @param error 
     */
    register( data: USER_REGISTER, success, error ) {

        this.create( data )
            .then( user => this.update( user, data ) )
            .then( success )
            .catch( error );

    }


    logout() {
        this.auth.signOut().then(()=>{
            console.log("sign out ok");
        }, () => {
            console.log("sing out error");
        });
    }

    

    /**
     * 
     */
    get isLogged() : boolean {
        if (this.auth.currentUser === void 0 ) return false;
        return this.auth.currentUser !== null;
    }

    get isAdmin() : boolean {
        return this._isAdmin;
    }


    /**
     * checks if the logged in user is admin.
     */
    checkAdmin() {
        if ( ! this.isLogged ) {
            console.log("checkAdmin() not logged");
            this._isAdmin = false;
            return;
        }
        console.log("Admin check");
        this.root.child('admin').child( this.uid ).once('value').then( s => {
            let re = s.val();
            console.log(`${this.uid} is admin ? ${re}`);
            if ( re === true ) this._isAdmin = true;
         });
    }



}