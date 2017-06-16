import * as firebase from 'firebase/app';
import { ERROR } from './../../error';



import {
    CATEGORY_PATH, CATEGORY, CATEGORIES, POST, POST_DATA_PATH, CATEGORY_POST_RELATION_PATH
} from './forum.interface';



export class Forum {
    debugPath: string = ''; // debug path.
    lastErrorMessage: string = '';
    constructor( public root: firebase.database.Reference ) {
        
    }

    get getLastErrorMessage() : string {
        let re = this.lastErrorMessage;
        this.lastErrorMessage = '';
        return re;
    }

    /**
     * 
     * Creates a category.
     * 
     * @param data Category data.
     * 
     * @return Promise
     *      on sucess, promise with category id. ( if there is no error and category has created, always .then() will be called. )
     *      otherwise, .catch() will be invoked. .catch() will be invoked when,
     *              - category exists
     *              - other errors.
     */
    createCategory( data: CATEGORY ) : firebase.Promise < any > {
        if ( this.checkKey( data.id ) ) return firebase.Promise.reject( new Error ( ERROR.malformed_key ) );
        return this.categoryExists( data.id ).then( re => {
            throw new Error( ERROR.category_exists ); // 여기에 throw 하면 요 밑 .catch() 에서 받는다. 따라서 .catch() 에서 category_exist 를 받으면 에러를 리턴하고, 아니면 생성을 한다.
        })
        .catch( e => {
            if ( e.message == ERROR.category_not_exist ) {
                return this.setCategory( data );
            }
            if ( e.message == ERROR.category_exists ) {
                this.setLastErrorMessage( `${data.id} category already exists` );
            }
            throw e;
        });
    }

    /**
     * Checks if the push key has in right form.
     * @param key The push key
     * @return true on error. false on success.
     */
    checkKey( key: string ) : boolean {
        if ( key === void 0 || ! key ) return true;
        if ( key.indexOf('#') != -1 ) return true;
        if ( key.indexOf('/') != -1 ) return true;
        if ( key.indexOf('.') != -1 ) return true;
        if ( key.indexOf('[') != -1 ) return true;
        if ( key.indexOf(']') != -1 ) return true;
        return false;
    }
    
    /**
     * 
     * @param data 
     * 
     * @code
     *
     * @endcode
     * 
     * 
     * @todo permission error.
     */
    editCategory( data: CATEGORY ) : firebase.Promise < any > {
        if ( this.isEmpty( data.id ) ) return this.error( ERROR.category_id_empty );
        if ( this.checkKey( data.id ) ) return firebase.Promise.reject( new Error ( ERROR.malformed_key ) );
        return this.categoryExists( data.id ).then( re => {
            return this.setCategory( data );
        });
    }


    /**
     * 
     * @param data Category data.
     * 
     * @return Promise
     * 
     *      on success, promies with category id
     *      on error, .catch() will be invoked.
     * 
     */
    setCategory( data: CATEGORY ) : firebase.Promise < any > {

        if ( this.isEmpty( data.id ) ) return this.error( ERROR.category_id_empty );

        data = this.undefinedToNull( data );


        // console.log("edit Category data: ", data);
        return this.category(data.id).set( data ).then( () => data.id );
    }







    /**
     * 
     * Deletes a forum category
     * 
     * @param id 
     * @param success 
     * @param error 
     * 
     * @code
     * 
     * @endcode
     * 
     */
    deleteCategory( id: string )  : firebase.Promise < any >  {
        if ( this.isEmpty( id ) ) return this.error( ERROR.category_id_empty );
        return this.category( id ).set( null );
    }



    /**
     * 
     * Returns a promise with all the categories
     * 
     * Use this method to get all the categores. But no live-update. Only get all categories.
     * 
     * 
     * @code
    
    
     * @endcode
     * 
     */
    getCategories() : firebase.Promise<any> {
        let categories: CATEGORIES = [];
        return this.category().once('value').then( snapshot => {
            //console.log(snapshot.val());
            let val = snapshot.val();
            for( let k of Object.keys(val) ) {
                let v = val[k];
                //console.log(v);
                categories.push( v );
            }
            return categories;
        });
    }

    /**
     * 
     * @param category Category id to get the data.
     * @return Promise
     *      category data promise. this may be null if the category does not exists.
     *      otherwise .catch() will be invoked.
     */
    getCategory( category: string ) : firebase.Promise <any> {
        if ( this.isEmpty( category ) ) return this.error( ERROR.category_id_empty );
        return this.category(category).once('value').then( s => s.val() );
    }

    isEmpty( category ) {
        return category === void 0 || ! category;
    }
    error( e ) {
        return firebase.Promise.reject( new Error ( e ) );
    }
    



    //////////////
    /// POST
    //////////////

    createPost( post: POST ) : firebase.Promise < any > {



        if ( post.categories === void 0 || post.categories.length === void 0 || post.categories.length == 0 ) return this.error( ERROR.no_categories );
        
        return this.categoriesExist( post.categories )
            .then(() => {
                let ref = this.postData().push();
                return this.setPostData( ref, post );
            });
    }



    /**
     * 
     * It sets post data on a post reference.
     * 
     * 'Set post data' means to set data on a reference. So, you need 'ref' to set where.
     * 
     * @param ref 
     * @param post 
     * 
     * @return on success, a promise with post key.
     *      otherwise, .catch() will be invoked.
     */
    setPostData( ref: firebase.database.ThenableReference, post: POST ) : firebase.Promise < any > {
        post.key = ref.key;
        // console.log('ref: ', ref.toString());
        post.stamp = Math.round( (new Date()).getTime() / 1000 );
        return ref.set( post ).then( () => post.key );
    }


    getPostData( key ) : firebase.Promise<any> {
        if ( this.isEmpty( key ) ) return this.error( ERROR.post_key_empty);
        return this.postData( key ).once('value').then( s => s.val() );
    }


    /**
     * 
     * @param categories Array of categories
     * 
     * @return Promise
     *      true promise on success.
     *      otherwise error promise.
     * 
     * 
     * @code expecting success.
     * 
            let categories = [ 'abc', category.id ];
            re = await this.forum.categoriesExist( categories )
            .catch( e => e.message );
            this.expect( re, true, `Categories exists: ` + categories.toString() );

     * @endcode
     * 
     * @code expecting failure with 'category_not_exist' error.
         
            /// check existence of multiple categories.
            /// expect failure.
            categories = [ 'abc', 'no-exist-category', category.id ];
            re = await this.forum.categoriesExist( categories )
            .catch( e => e.message );
            this.expect( re, ERROR.category_not_exist, `A category should not be exists. : ` + categories.toString() );
            
     * @endcode
     */
    async categoriesExist( categories: Array<string> ) {
        for( let category of categories ) {
            await this.categoryExists( category );
        }
        return true;
    }


    /**
     * 
     * @param category 
     * 
     * @return
     *      on sucess, promise with true.
     */
    categoryExists( category: string ) : firebase.Promise<any> {
        return this.category( category ).once('value')
            .then( s => {
                if ( s.val() ) return true;
                else {
                    this.setLastErrorMessage( `Category ${category} does not exist.`);
                    return firebase.Promise.reject( new Error ( ERROR.category_not_exist ) );
                }
             });
    }




    //// FUNCTIONS


    /**
     * 
     * 
     * @note category exsit checkup must be done here.
     * 
     * 
     * 
     * 
     * 
     * @param key - is the post push key.
     * @param post 
     */
    async setCategoryPostRelation( key: string, post: POST ) {


        this.log(post);

        if ( post === void 0 ) {
            this.log(`post is undefined on setCategoryPostRelation`);
            return;
        }
        if ( post.categories === void 0 || post.categories.length === void 0 || post.categories.length == 0 ) {
            this.log(`post.categories is undfined or no categories.`);
            return;
        }
        
        for ( let category of post.categories ) {
            this.log(`writing for category : ${category}`);

            let re = await this.categoryExists( category );
            if ( re !== false ) return;
            
            this.categoryPostRelation.child( category ).child( key).set( true );
        }
    }



    page( o ) {
        let $ref = this.postData().orderByKey().limitToLast( o.size );

        return $ref
            .once('value')
            .then( s => {
                let objects = s.val();
                let posts = [];
                for( let k of Object.keys(objects).reverse() ) {
                    posts.push( objects[k] );
                }
                return posts;
            } );

    }


    /**
     * 
     * Turns undefined into null to avoid "first argument contains undefined in property firebase" error.
     * 
     * @param obj 
     * 
     * @code
     *              data = this.database.undefinedToNull( data );
     * @endcode
     * 
     */
    undefinedToNull(obj) {
        obj = JSON.parse(JSON.stringify(obj, function (k, v) {
                if ( v === undefined ) return null;
                else return v;
            } ) );
        return obj;
    }



    //// PATHS

    category( name? ) : firebase.database.Reference {
        if ( this.isEmpty(name) ) return this.root.ref.child( this.categoryPath );
        else return this.root.ref.child( this.categoryPath ).child( name );
    }

    get categoryPath() : string {
        return this.path( CATEGORY_PATH );
    }


    postData( key?: string ) : firebase.database.Reference {
        if ( this.isEmpty(key) ) return this.root.ref.child( this.postDataPath );
        else return  this.root.ref.child( this.postDataPath ).child( key );
    }
    get postDataPath() : string {
        return this.path( POST_DATA_PATH );
    }
    get categoryPostRelation() : firebase.database.Reference {
        return  this.root.ref.child( this.categoryPostRelationPath );
    }
    get categoryPostRelationPath() : string {
        return this.path( CATEGORY_POST_RELATION_PATH );
    }
    


    path( p: string ) {
        p = this.debugPath + p;
        // console.log(`path: ${p}`);
        return p;
    }


    ////////////////////////////////////
    ////
    ////    POST
    ////
    ////////////////////////////////////
    


    log(m) {
        console.log('LOG: ', m);
    }
    setLastErrorMessage(m) {
        this.lastErrorMessage = m;
        // console.log('------> ERROR: ', m);
    }
    

}
