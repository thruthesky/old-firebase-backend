import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { Forum } from './forum';
import { ALL_CATEGORIES } from './../../../firebase-backend.module';






@Injectable()
export class ForumService extends Forum {

    
    constructor(
    ) {
        super();
    }




    


    /**
     * 
     */
    observePosts() {
        // return this.af.list( this.category(ALL_CATEGORIES) );


    }

}