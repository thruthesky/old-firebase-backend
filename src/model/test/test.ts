import { Injectable } from '@angular/core';

import * as firebase from 'firebase';

import {
    POST,
    ApiService,
    ERROR,
    USER_REGISTER
} from './../../../firebase-backend.module';

import { UserService } from './../user/user.service';
import { ForumService } from './../forum/forum.service';


@Injectable()
export class TestService {
    constructor(
        private forum: ForumService, // ForumService 을 inject 하면 에러가 발생한다? circulr reference 가 아닌 것 같은데,
        private api: ApiService,
        private user: UserService
    ) { }

    run(  ) {
        console.log("TestService::run()");

        this.userLogout();
        this.userRegister( () => this.userLogout() );

        


        let data = {
            function: 'create',
            categories: ['abc'],
            uid: this.testUid,
            subject: this.testSubject,
            content: this.testContent
        };

        // this.api.post(data, { debug: true })
        //     .subscribe(res => {
        //         console.log("Post success", res.data);
        //         this.forum.getPostData( res.data )
        //           .then( res => console.log("Post data: ", res) );
        //     }, e => {
        //         console.error("Failed on posting : " + e);
        //     });

    }

    expect( a, b, message ) {
        if (  a === b ) this.success(`${a}==${b} => ${message}`);
        else this.error(`${a}==${b} => ${message}`);
    }
    test( q, message ) {
        if ( q ) this.success( message );
        else this.error( message );
    }
    success( message ) {
        console.log(`SUCCESS: ${message}`);
    }
    error( message ) {
        console.log(`ERROR: ${message}`);
    }

    async userRegister( callback ) {
        let name = this.forum.randomString();
        let data: USER_REGISTER = {
            name: 'Name-' + name,
            email: '',
            password: ''
        };


        // expect error. empty password.


        await firebase.auth().signOut();


        data.email = "testabcdefg009@gamil.com"
        await this.user.register( data )
            .then(() => this.error("Registration without password must be error."))
            .catch( e => this.expect( e.message, ERROR.auth_weak_password , `Should be auth/weak-password error` ) );


        data.email = '';
        data.password = name;
        await this.user.register( data )
            .then( user => this.error( `Registration with empty email must be failed.`) )
            .catch( e => this.expect( e.message, ERROR.auth_invalid_email, `Email is empty. Must be invalid email` ));


        // expect success.
        data.email = name + '@gmail.com';
        let uid = await this.user.register( data )
            .then( uid => { this.success(`Registration success.`); return uid; } )
            .catch( e => this.error( `Must be success.` ));
            

        this.expect( this.user.uid, uid, "uid matches." );
        this.test( this.user.loginUser, `user.loginUser must exists after login..`);
        this.expect( this.user.loginUser.displayName, data.name, "name matches." );

        // get profile
        let profile = await this.user.getProfile();
        this.test( profile, `Profile must exists.`);
        this.expect( profile.name, data.name, `name matches with getProfile().name`);


        await this.userLogout();
        this.expect( this.user.loginUser, null, 'user.loginUser must be null since the user logged out');
        
        // expect error. Due to the registration with signup error. There will be POST 400 error.
        await this.user.register( data )
            .then( user => this.error(`Must be eamil in use error.`) )
            .catch( e => this.expect( e.message, ERROR.auth_email_already_in_use, `Should be POST 400 eror. And have to be failed with registration same email twice.` ));


        callback();
    }


    async userLogout() {
        await this.user.logout();
    }
    



    testPostData(): POST {
        return {
            function: 'create',
            uid: this.testUid,
            subject: this.testSubject,
            content: this.testContent,
            categories: this.testCategories,
            secret: ''
        };
    }

    get testSubject(): string {
        let d = new Date();
        return 'SUBJECT: ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    }

    get testContent(): string {
        let d = new Date();
        return 'TEST CONTENT' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    }

    get testUid(): string {
        return '0PNzxFcsyiQ4LqOXPLtYbgFtgTw1';
    }

    get testCategories() {
        return ['abc', 'flower'];
    }


}