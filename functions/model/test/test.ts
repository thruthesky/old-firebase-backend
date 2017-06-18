import { Injectable } from '@angular/core';

import {
    POST,
    ApiService,
    ForumService
} from './../../../firebase-backend.module';


@Injectable()
export class TestService {
    api;
    forum;
    constructor(
    ) { }

    /**
     * constructor 에서 api service 와 forum service 를 inject 하니 에러가 발생한다. 왜지???
     * @param api 
     * @param forum 
     */
    run( api: ApiService, forum: ForumService ) {
        this.api = api;
        this.forum = forum;


        let data = {
            function: 'create',
            categories: ['abc'],
            uid: this.testUid,
            subject: this.testSubject,
            content: this.testContent
        };

        this.api.post(data, { debug: true })
            .subscribe(res => {
                console.log("Post success", res.data);
                this.forum.getPostData( res.data )
                  .then( res => console.log("Post data: ", res) );
            }, e => {
                console.error("Failed on posting : " + e);
            });

    }



    testPostData(): POST {
        return {
            function: 'create',
            uid: this.testUid,
            subject: this.testSubject,
            content: this.testContent,
            categories: this.testCategories
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