/**
 * When 'PushMessageService' is injected, it will ask permission.
 * 
 */
import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import * as firebase from 'firebase';


@Injectable()
export class PushMessageService {
    private messaging: firebase.messaging.Messaging;
    private db: firebase.database.Database;
    constructor(
        private http: Http
    ) {
        /// init
        this.messaging = firebase.messaging();
        this.db = firebase.database();


        /// request user permission every time.
        this.requestPermission();

        this.messaging.onMessage((payload) => {
            alert(payload['notification']['title'] + '\n' + payload['notification']['body']);
            location.href = payload['notification']['click_action'];
        });

    }


    reduceTokens() {
        this.db.ref('/').child('push-tokens').once('value')
            .then(s => {
                const obj = s.val();
                if (!obj) return;
                if (Object.keys(obj).length > 5) {
                    // console.log("Going to delete /push-tokens")
                    this.db.ref('/').child('push-tokens').set(null);
                }
            });
    }


    requestPermission() {
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
                            // console.log("Got token: ", currentToken);
                            this.reduceTokens();    /// delete tokens first
                            setTimeout(() => {      /// and then save my token.
                                this.db.ref('/').child('push-tokens').child(currentToken).set(true);
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

    send(title, body, url?) {

        this.db.ref('/').child('push-tokens').once('value').then(snap => {
            const obj = snap.val();
            if (!obj) return;
            const tokens = Object.keys(obj);
            // console.log(tokens);
            for (const token of tokens) {
                this.requestPush(token, title, body, url);
            }
        });
    }

    requestPush(token, title, body, url) {

        if (!title) title = 'I am Talkative Notification !';
        if (!url) url = 'https://iamtalkative.com';
        // console.log("requestPush with: ", token, title, body);
        const data = {
            'notification': {
                'title': title,
                'body': body,
                'icon': '/assets/images/logo/logo-icon.png',
                'click_action': url
            },
            'to': token
        };
        this.http.post('https://fcm.googleapis.com/fcm/send', data, this.requestOptions)
            .subscribe(res => {
                // console.log(res);
            }, e => {
                console.error(e);
            });
    }

    get requestOptions(): RequestOptions {
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAmmHlkKc:APA91bFjDBATelEaBTcmpTWwbm9YmM1-nHhYWOAEf3DMQVm73MhjKxGlGvQ5q_YGJFyGdQ_DplRvXktpmudzWGoWrC-OZE8pYvFk-mlSJPEIvm7s_N4laHTYlmTE-sB4KxY1WZsJcl6q'
        });
        const options = new RequestOptions({ headers: headers });
        return options;
    }


}
