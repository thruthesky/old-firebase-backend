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
     * Use this to live-update.
     * 
     * @code

        this.forum.observeCategory().subscribe(res => {
            console.log(res);
            this.categories = res;
        });

     * @endcode
     */
    // observeCategory() {
    //     // return this.af.list( this.categoryPath );

    //     // this.root.child( this.categoryPath ).on('value', snapshot => {
    //     //     callback( snapshot.val() );
    //     // });


    // }

    


    /**
     * 
     */
    observePosts() {
        // return this.af.list( this.category(ALL_CATEGORIES) );


    }

}