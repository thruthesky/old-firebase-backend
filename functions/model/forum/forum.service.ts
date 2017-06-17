import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase';
import { Forum } from './forum';
import { ALL_CATEGORIES } from './../../../firebase-backend.module';






@Injectable()
export class ForumService extends Forum {

    
    constructor(
        public af: AngularFireDatabase
    ) {
        super( af.database.ref('/') );
    }




    /**
     * 
     * Use this to live-update.
     * 
     * @code
     
                this.category.observe().subscribe( res => {
                    console.log(res);
                    this.categories = res;
                });

     * @endcode
     */
    observeCategory() {
        return this.af.list( this.categoryPath );

        // this.root.child( this.categoryPath ).on('value', snapshot => {
        //     callback( snapshot.val() );
        // });


    }

    


    observePosts() {
        return this.af.list( this.category(ALL_CATEGORIES) );
    }

}