/**
 * When 'PushMessageService' is injected, it will ask permission.
 * 
 */
import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import * as firebase from 'firebase';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';




import { Base } from './../base/base';

import {
    PUSH_MESSAGE,
    USER_PUSH_TOKEN_PATH
} from './../../interface';

import { ERROR } from './../error/error';
import { UserService } from './../user/user.service';


const USER_TOKEN = 'user-token';

@Injectable()
export class PushMessageService extends Base {
    private messaging: firebase.messaging.Messaging;
    private db: firebase.database.Database;
    private auth: firebase.auth.Auth;
    constructor(
        private http: Http,
        private user: UserService
    ) {
        super();

        this.runIfWeb();


    }

    get isCordova(): boolean {
        console.log("document.URL", document.URL);
        if (window['cordova']) return true;
        if ( document.URL.indexOf("file://") != -1 ) return true;
        if ( document.URL.toLowerCase().indexOf("http") == 0 ) return false;
        return false;
    }

    runIfWeb() {
        if ( this.isCordova ) return;
        
        /// init
        this.messaging = firebase.messaging();
        this.db = firebase.database();
        this.auth = firebase.auth();

        /// request user permission every time.
        // this.requestPermission();

        this.requestPermissionIfUserLoggedIn();

        this.messaging.onMessage((payload) => {
            alert(payload['notification']['title'] + '\n' + payload['notification']['body']);
            location.href = payload['notification']['click_action'];
        });
    }

    /**
     * 
     */
    requestPermissionIfUserLoggedIn() {
        this.user.loginState.subscribe(uid => {
            if (uid) this.requestPermission(uid);
        });
    }



    /**
     * 
     */
    requestPermission(uid: string) {

        /**
         * Request permission (to user) for receiving messages.
         */
        this.messaging.requestPermission()
            .then(() => {
                console.log('requestPermission() granted');
                this.messaging.getToken()
                    .then((currentToken) => {
                        if (currentToken) {
                            //
                            console.log("Got token: ", currentToken);

                            if (currentToken == localStorage.getItem(USER_TOKEN)) {
                                console.log("User token has not changed. so, not going to update");
                                return;
                            }
                            console.log("User token has chagned. so, going to update.");
                            setTimeout(() => {      /// and then save my token.
                                // this.db.ref().child('push-tokens').child(currentToken).set(true)
                                this.token(uid).set(currentToken)
                                    .then(() => {
                                        // token has been set
                                        localStorage.setItem(USER_TOKEN, currentToken);
                                    })
                                    .catch(e => console.error(e));
                            }, 2000);

                        } else {
                            console.log('No Instance ID token available. Request permission to generate one.');
                        }
                    })
                    .catch(function (err) {
                        console.log('An error occurred while retrieving token. ', err);
                    });

            })
            .catch(e => {
                if (e && e['code']) {
                    switch (e['code']) {
                        case 'messaging/permission-default': /// user closed permission popup box by clicking 'x' button.
                            console.log('user closed permission popup box by clicking "x" button.');
                            break;
                        case 'messaging/permission-blocked': /// user blocked
                            console.log('user blocked push message');
                            break;
                        default: ///
                            console.log(e);
                    }
                } else {
                    console.log('Unable to get permission to notify. ( It does not look like firebase error )', e);
                }
            });
    }

    /**
     * Return a promise
     * @param message Message data
     * @return a promise
     */
    send(message: PUSH_MESSAGE): firebase.Promise<any> {
        return this.getToken(message.uid).then(token => {
            message.token = token;
            return this.requestPush(message).toPromise()
                .then(() => message);
        });


        // this.db.ref('/').child('push-tokens').once('value').then(snap => {
        //     const obj = snap.val();
        //     if (!obj) return;
        //     const tokens = Object.keys(obj);
        //     // console.log(tokens);

        //     for (const token of tokens) {
        //         this.requestPush( message );
        //     }
        // });
    }

    requestPush(message: PUSH_MESSAGE): Observable<any> {

        if (!message.title) message.title = 'Sonub Nofification';
        if (!message.url) message.url = 'https://sonub.com';
        if (!message.icon) message.icon = '/assets/img/push-message/icon.png';
        // console.log("requestPush with: ", token, title, body);
        const data = {
            'notification': {
                'title': message.title,
                'body': message.body,
                'icon': message.icon,
                'click_action': message.url
            },
            'to': message.token
        };
        return this.http.post('https://fcm.googleapis.com/fcm/send', data, this.requestOptions);
        // .subscribe(res => {
        //     // console.log(res);
        // }, e => {
        //     console.error(e);
        // });
    }

    get requestOptions(): RequestOptions {
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAALbd78tk:APA91bFAWHYdlihD2ACgug0qE6RXjn28E7dVkBItE-fzXFB27TmmlGnl31JdmdHauJpLu0T8QPGRY6xIuORyYVR1Q-swFb9IQlVQlgpB_hjwNdNbm_0EodlLvW_B9-zdJ-obffThlto_'
        });
        const options = new RequestOptions({ headers: headers });
        return options;
    }



    /**
     * Return token refernce.
     * @param uid User key
     */
    token(uid: string): firebase.database.Reference {
        return this.db.ref().child(USER_PUSH_TOKEN_PATH).child(uid);
    }

    getToken(uid: string): firebase.Promise<any> {
        return this.token(uid).once('value').then(snap => {
            let token = snap.val();
            if (token) return token;
            else return this.error(ERROR.push_token_is_empty);
        });
    }
}
