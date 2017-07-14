import * as firebase from 'firebase';
import { Base } from './../base/base';
import { ERROR } from '../error/error';

import {
    CATEGORY_PATH, CATEGORY, CATEGORIES, POST,
    POST_DATA_PATH, CATEGORY_POST_RELATION_PATH, ALL_CATEGORIES,
    POST_FRIENDLY_URL_PATH, COMMENT, COMMENT_PATH
} from './../../interface';

const allowedApiFunctions = [
    'createPost', 'editPost', 'deletePost',
    'createComment', 'editComment', 'deleteComment'
];




/**
 * This is not a service. You cannot inject.
 */
export class Forum extends Base {
    debugPath: string = ''; // debug path.
    lastErrorMessage: string = '';




    constructor() {
        super();
    }


    get getLastErrorMessage(): string {
        let re = this.lastErrorMessage;
        this.lastErrorMessage = '';
        return re;
    }

    /**
     * 
     * Creates a category.
     * 
     * @note This method does not check admin authentication.
     * @note So, This method must not be called by Javascript or Angular.
     * @note So, There is no reason for this code to be bunlded in Angular. This code must be in backend if you decide to hide the backend structure.
     * @note But you cannot hide the backend structure.
     * @note So, there is no benefit to put this code in backend and try to hide the database structure.
     * 
     * @note 
     * 
     * @param data Category data.
     * 
     * @return Promise
     *      on sucess, promise with category id. ( if there is no error and category has created, always .then() will be called. )
     *      otherwise, .catch() will be invoked. .catch() will be invoked when,
     *              - category exists
     *              - other errors.
     */
    createCategory(data: CATEGORY): firebase.Promise<any> {
        if (this.checkKey(data.id)) return this.error(ERROR.malformed_key);
        return this.categoryExists(data.id)
            .then(re => {
                throw new Error(ERROR.category_exists); // 여기에 throw 하면 요 밑 .catch() 에서 받는다. 따라서 .catch() 에서 category_exist 를 받으면 에러를 리턴하고, 아니면 생성을 한다.
            })
            .catch(e => {
                if (e.message == ERROR.category_not_exist) { // Okay. No category exists. Let's create one (정상. 카테고리가 존재하지 않으므로 카테고리를 생성한다.)
                    return this.setCategory(data);
                }
                if (e.message == ERROR.category_exists) {
                    this.setLastErrorMessage(`${data.id} category already exists`);
                }
                throw e;
            });
    }

    /**
     * Checks if the push key has in right form.
     * @param key The push key
     * @return true on error. false on success.
     */
    checkKey(key: string): boolean {
        if (key === void 0 || !key) return true;
        // if (key.length != 21) return true; // key can be made by user.
        if (key.indexOf('#') != -1) return true;
        if (key.indexOf('/') != -1) return true;
        if (key.indexOf('.') != -1) return true;
        if (key.indexOf('[') != -1) return true;
        if (key.indexOf(']') != -1) return true;
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
    editCategory(data: CATEGORY): firebase.Promise<any> {
        if (this.isEmpty(data.id)) return this.error(ERROR.category_id_empty);
        if (this.checkKey(data.id)) return this.error(ERROR.malformed_key);
        return this.categoryExists(data.id).then(re => {
            return this.setCategory(data);
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
    setCategory(data: CATEGORY): firebase.Promise<any> {

        if (this.isEmpty(data.id)) return this.error(ERROR.category_id_empty);

        data = this.trimObject(data);


        // console.log("edit Category data: ", data);
        return this.category(data.id).set(data).then(() => data.id);
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
    deleteCategory(id: string): firebase.Promise<any> {
        if (this.isEmpty(id)) return this.error(ERROR.category_id_empty);
        return this.category(id).set(null);
    }



    /**
     * 
     * Returns a promise with all the categories
     * 
     * Use this method to get all the categores. But no live-update. Only get all categories.
     * 
     * 
     * @code
    
        this.forum.getCategories()
            .then( categories => this.categories = categories )
            .catch( e => console.error(e) );
            
     * @endcode
     * 
     */
    getCategories(): firebase.Promise<any> {
        let categories: CATEGORIES = [];
        return this.category().once('value').then(snapshot => {
            //console.log(snapshot.val());
            let val = snapshot.val();
            if (val === null) return this.error(ERROR.no_category_exists_while_get_categories);
            for (let k of Object.keys(val)) {
                let v = val[k];
                //console.log(v);
                categories.push(v);
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
    getCategory(category: string): firebase.Promise<any> {
        if (this.isEmpty(category)) return this.error(ERROR.category_id_empty);
        return this.category(category).once('value').then(s => s.val());
    }



    ////////////////////////////////////////////////////////
    ///
    /// POST Routines
    //
    ////////////////////////////////////////////////////////


    isEmptyCategory(post) {
        if (post['categories'] === void 0 || post.categories.length === void 0 || post.categories.length == 0) return true;
        else return false;
    }
    /**
     * Returns error code if the input post data is wrong.
     * @use when you need to check the post data for create/edit.
     * @param post Post data from user
     */
    checkPost(post): string {
        if (post === void 0) return ERROR.post_data_is_empty;
        if (this.isEmptyCategory(post)) return ERROR.no_categories;
        return null;
    }






    /**
     * It does all the extra works that are needed to create a post.
     *      - category
     *      - friendly url
     *
     * @param post Post data to create
     * @return a promise with post key.
     */
    async createPost(post: POST): Promise<any> {
        if (this.checkPost(post)) return this.error(this.checkPost(post));
        if (post.key) return this.error(ERROR.post_key_exists_on_create);
        await this.categoriesExist(post.categories);
        let ref = this.postData().push();

        // check if friendly url exists.
        // if not exists create one with title.
        // if exists, create with push-key + title.

        let friendlyUrlKey = await this.createFriendlyUrl(ref.key, post.subject);

        post.friendly_url_key = friendlyUrlKey;

        delete post.secret;
        return this.setPostData(ref, post);
    }

    /**
     * @see README#SEO#Friendly URL
     * @param pushKey Post push-key
     * @param subject Post subject
     * @return a promise with post key.
     */
    createFriendlyUrl(pushKey, subject): firebase.Promise<any> {
        if (!pushKey) return this.error(ERROR.push_key_empty_on_creating_friendly_url);
        //// if ( ! subject ) return this.error( ERROR.post_subject_is_empty_on_creating_friendly_url );
        ////....

        if (subject) subject = this.convertFriendlyUrlString(subject);
        else subject = pushKey;

        return this.postFriendlyUrl.child(subject).once('value')
            .then(snap => {
                let friendlyUrlkey;
                if (snap.val()) friendlyUrlkey = pushKey + '-' + subject;
                else friendlyUrlkey = subject;
                return this.postFriendlyUrl.child(friendlyUrlkey).set(pushKey)
                    .then(() => friendlyUrlkey);
            })
    }

    /**
     * Returns safe string for friendly url.
     * @param subject 
     */
    convertFriendlyUrlString(subject) {
        let ns = subject.replace(/[`~!@#$%^&*()_|+ =?;:'",.<>\{\}\[\]\\\/]/gm, '-');
        ns = ns.replace(/^\-+/gm, '');
        if (ns) ns = ns.replace(/\-+$/gm, '');
        if (ns) ns = ns.replace(/\-+/gm, '-');
        return ns;
    }




    /**
     * 
     * @param post 
     */
    async editPost(post: POST): Promise<any> {
        if (this.checkPost(post)) return this.error(this.checkPost(post));
        if (!post.key) return this.error(ERROR.post_key_empty);

        await this.getPostData(post.key);

        await this.categoriesExist(post.categories);
        let old_post = await this.getPostData(post.key);

        if (post.uid != old_post.uid) return this.error(ERROR.permission_denied);

        let ref = this.postData(post.key);

        delete post.secret;
        return this.setPostData(ref, post, old_post);
    }

    /**
     * 
     * @param o - options to delete a post.
     * @return a promise with post key.
     */
    async deletePost(o: { uid: string, key: string }): Promise<string> {

        if (this.isEmpty(o.uid)) return this.error(ERROR.uid_is_empty); /// uid has already check by 'api' but for direct call.
        if (this.isEmpty(o.key)) return this.error(ERROR.post_key_empty);

        let post: POST = await this.getPostData(o.key);


        if (o.uid != post.uid) return this.error(ERROR.permission_denied);

        await this.deleteCategoryPostRelation(post.key, post.categories);
        await this.postData(o.key).set(null);

        return o.key;
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
    setPostData(ref: firebase.database.Reference, post: POST, old_post?: POST): firebase.Promise<any> {
        post.key = ref.key;
        // console.log('ref: ', ref.toString());
        post.stamp = (new Date()).getTime();
        return ref.set(post)
            .then(() => this.setCategoryPostRelation(post.key, post, old_post)) // category post relation
            .then(() => post.key);
    }


    /**
     * Returns post data.
     * @param key Post key
     */
    getPostData(key): firebase.Promise<any> {
        if (this.isEmpty(key)) return this.error(ERROR.post_key_empty);
        return this.postData(key).once('value').then(s => {
            let post = s.val();
            if (post) return post;
            else throw new Error(ERROR.post_not_found_by_that_key); // this.error( ERROR.post_not_found_by_that_key );
        });
    }
    /**
     * Returns a promise of true if the post exists.
     * @param key Post key
     */
    checkPostExists(key): firebase.Promise<any> {
        if (this.isEmpty(key)) return this.error(ERROR.post_key_empty);
        return this.postData(key).child('key').once('value').then(snap => {
            if (snap.val()) return true;
            else return false;
        })
            .catch(e => e.message);
    }


    //////////////////////////////////////////////////////////////////////
    ///
    /// END OF POST Rutines
    ///
    //////////////////////////////////////////////////////////////////////




    //////////////////////////////////////////////////////////////////////
    ///
    /// COMMENT Rutines
    ///
    //////////////////////////////////////////////////////////////////////


    /**
     * 
     *      1. Check input
     *      2. Check if post exists.
     *          2.a) If not exists error.
     *      3. Check if post key exists on /forum/comment/post-push-key
     *          3.a) If not exsits, create
     *      4) If input(to create) commment has no parent comments, create comment.
     *          4.a) Or if it has parents comment, then get reference of parent paths.
     *          4.b) and create on the last.
     * 
     * 
     *
     * @param comment Comment to create
     * 
     * @return a promise with newly created comment path ( full path )
     */
    async createComment(comment: COMMENT): Promise<any> {

        // if ( comment.path === void 0 ) return this.error( ERROR.path_is_undefined_on_comment_create );
        // if ( ! comment.ancestors ) return this.error( ERROR.path_is_empty_string );
        // if ( comment.ancestors.length == 0 ) return this.error( ERROR.ancestors_is_empty_array_on_comment_create );

        if (this.isEmpty(comment.path)) return this.error(ERROR.path_is_empty_on_create_comment);



        let post_key: string = comment.path.split('/')[0];
        let re: boolean = await this.checkPostExists(post_key);
        if (re !== true) return this.error(ERROR.post_not_found_by_that_key_on_create_comment);


        // let path = comment.ancestors.join('/');

        // console.log("path:", comment.ancestors );
        let ref = this.comment().child(comment.path).push();


        // let backupPath = comment.path;
        // delete comment.path;
        delete comment.secret;
        comment.path += '/' + ref.key;

        return ref.set(comment)
            .then(() => comment.path);
    }

    /**
     * 
     * @param comment Comment to edit
     * @return a promise with comment path ( full path )
     */
    async editComment(comment: COMMENT): Promise<string> {

        let path = comment.path;

        //console.log("editComment", comment);

        if (this.isEmpty(path)) return this.error(ERROR.path_is_empty_on_create_comment);
        let old_uid = await this.getCommentUid(path);
        //console.log("_uid: ", old_uid);

        if (comment.uid != old_uid) return this.error(ERROR.permission_denied_not_your_comment_on_edit_comment);


        // delete comment.path;
        delete comment.secret;

        return this.comment().child(path).set(comment).then(() => path);
    }



    /**
     * 
     * Returns a promise of 'uid'.
     * 
     * @param path Path of comment
     * @return a promise of uid.
     */
    async getCommentUid(path): Promise<string> {
        if (this.isEmpty(path)) return this.error(ERROR.empty_path_on_get_comment_uid);
        return this.comment().child(path).child('uid').once('value').then(snap => {
            if (snap.val()) return snap.val();
            else return '';
        });
    }


    /**
     * Returns a promise with Comments.
     * @param path Path for the comment
     * 
     * @return a promise of comment/comments.
     *      - It can return only a single comment
     *      - Or it can return all nesting comments.
     */
    getComments(path): firebase.Promise<any> {
        // console.log("getComment: ", path);
        if (this.isEmpty(path)) return this.error(ERROR.empty_path_on_get_comment);
        return this.comment().child(path).once('value').then(snap => snap.val());
    }




    /**
     * 
     * @param o - options to delete a post.
     * @return a promise with deleted comment path.
     */
    async deleteComment(comment: COMMENT): Promise<string> {


        if (this.isEmpty(comment.path)) return this.error(ERROR.comment_path_empty_on_delete_comment);

        let old_uid = await this.getCommentUid(comment.path);
        if (comment.uid != old_uid) return this.error(ERROR.permission_denied_not_your_comment_on_delete_comment);


        await this.comment().child(comment.path).set(null);

        return comment.path;
    }





    /**
     * Make the tree strcuture comment object into array.
     * @param comment commet from data.
     * @return Array of comments.
     */
    commentsTreeToArray(comment: COMMENT, arrComments = [], depth = 0) {



        /**
         * if depth == 0, then it is '/forum/comment/-push-key' which has no comment data. it only has comment keys of the post.
         */
        if (depth) {
            let obj: COMMENT = {
                uid: comment.uid,
                path: comment.path,
                content: comment.content,
                stamp: comment.stamp,
                files: comment.files,
                depth: depth
            };
            arrComments.push(obj);
        }


        for (let p in comment) {
            if (typeof comment[p] === "object") {
                if (comment[p]['path'] !== void 0) {
                    depth++;
                    this.commentsTreeToArray(comment[p], arrComments, depth);
                    depth--;
                }
            }
        }

        return arrComments;
    }




    //////////////////////////////////////////////////////////////////////
    ///
    /// END OF COMMENT Rutines
    ///
    //////////////////////////////////////////////////////////////////////




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
    async categoriesExist(categories: Array<string>) {
        for (let category of categories) {
            await this.categoryExists(category);
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
    categoryExists(category: string): firebase.Promise<any> {

        return this.category(category).once('value')
            .then(s => {
                // if ( category == 'def' ) debugger;
                if (s.val()) return true;
                else {
                    this.setLastErrorMessage(`Category ${category} does not exist.`);
                    return this.error(ERROR.category_not_exist);
                }
            });
    }




    //// FUNCTIONS


    /**
     * 
     * 
     * @note new_categories exsitence must be checked right before this method.
     * @note this will remove old categories.
     * 
     * 
     * 
     * @warning it does not check if category exists or not. So you need to check it right before you cal this mehtod.
     * 
     * 
     * @param key - is the post push key.
     * @param post 
     */
    async setCategoryPostRelation(key: string, new_post: POST, old_post?: POST) {

        if (!new_post || !new_post.categories || !new_post.categories.length) return;

        // delete old categories.
        // if ( old_post && old_post.categories && old_post.categories.length  ) {
        //     for (let category of old_post.categories) {
        //         await this.categoryPostRelation.child( category ).child(old_post.key).set( null );
        //     }
        // }
        if (old_post) await this.deleteCategoryPostRelation(old_post.key, old_post.categories);


        for (let category of new_post.categories) {
            // console.log(`writing for category : ${category}`);
            /**
             * Does not save uid here since 'uid' cannot be trusted as of Jun 16, 2017.
             */
            await this.categoryPostRelation().child(category).child(key).set(true);
        }
        await this.categoryPostRelation().child(ALL_CATEGORIES).child(key).set(true);
    }

    /**
     * Deletes category and post relationsip.
     * @Warning it deletes the 'ALL_CATEGORIES' relationship also.
     * 
     * @param key 
     * @param categories 
     */
    async deleteCategoryPostRelation(key, categories) {
        if (categories && categories.length) {
            for (let category of categories) {
                await this.categoryPostRelation().child(category).child(key).set(null);
            }
            await this.categoryPostRelation().child(ALL_CATEGORIES).child(key).set(null);
        }
    }



    /**
     * 
     * Returns a Promise with an array of posts to display a page ( of posts, comment, or any reference. )
     * 
     * @note This method returns a Promise of posts. It lacks of addition information. like if it is a last page or not.
     *          @see pageHelper() to get those helpful information.
     * 
     * @param o Options.
     *      o['ref'] is the reference to look for.
     *      o['key'] is the key to get next page of posts.
     *      o['size'] is the numbrer of nodes(posts, comments, data) you want to key.
     *      o['keyOnly'] - if it true, then only key will be returned as an array without 'data'.
     * 
     * @code
        let o = {
            ref: this.app.forum.categoryPostRelation(category),
            key: this.paginationKey,
            size: 5,
            keyOnly: true
        };
        this.app.forum.page( o )
            .then( posts => {
                console.log("page: ", posts);
            })
            .catch( e => this.app.warning( e ) );
     * @endcode
     */
    page(o): firebase.Promise<any> {
        console.log("page: ", o);
        let ref = o['ref'] ? o['ref'] : this.postData();
        let size = o['size'] ? o['size'] : 10;

        let q = ref.orderByKey();
        if (o['key']) q = q.endAt(o['key']);
        q = q.limitToLast(size);

        return q
            .once('value')
            .then(s => {
                let posts = [];
                let objects = s.val();
                if (objects === null) return posts;
                for (let k of Object.keys(objects).reverse()) {
                    if (o['keyOnly']) posts.push(k);
                    else posts.push(objects[k]);
                }
                return posts;
            });
    }
    /**
     * This method returns an Object.
     * 
     * @Attention - since firebase adds the key with 'endAt(key)' for pagination, it needs to cut off the last node which will be included on next search.
     *              so, developers should give 1 more on option['size'] for paginationKey.
     * 
     * @param o Options
     * @param posts posts returned from page()
     * 
     * @return object
     *              object.noMorePosts - if it is true, it means the page-scroll reached at the end of the posts.
     *              object.paginationKey - it the next pagination key.
     *              object.posts - is the posts to display.
     */
    pageHelper(o, posts: Array<string>) {
        let obj = {
            noMorePosts: false,
            paginationKey: '',
            posts: posts
        };
        if (!posts || posts.length == 0 || posts.length < o.size) obj.noMorePosts = true;
        if (posts) {
            if (posts.length > 1) {
                obj.paginationKey = posts[posts.length - 1];
                if (posts.length == o.size) posts.pop();
                obj.posts = posts;
            }
        }
        return obj;
    }




    /////////////////////////////////////////////////////////////////////////
    ////
    //// PATHS
    ////
    /////////////////////////////////////////////////////////////////////////

    category(name?): firebase.database.Reference {
        if (this.isEmpty(name)) return this.root.ref.child(this.categoryPath);
        else return this.root.ref.child(this.categoryPath).child(name);
    }


    get categoryPath(): string {
        return this.path(CATEGORY_PATH);
    }


    /**
     * 
     * @param category 
     * @code
     *              this.categoryPostRelation().child(category).child(key).set(true);
     *              this.categoryPostRelation().child(ALL_CATEGORIES).child(key).set(true);
     * @endcode
     */
    categoryPostRelation(category?: string): firebase.database.Reference {
        if (this.isEmpty(category)) return this.root.ref.child(this.categoryPostRelationPath);
        else return this.root.child(this.categoryPostRelationPath).child(category);
    }

    get categoryPostRelationPath(): string {
        return this.path(CATEGORY_POST_RELATION_PATH);
    }




    /**
     * 
     * @param key Post push-key to load a post.
     * @code
                this.app.forum.postData().once('value').then(s => {
                        let obj = s.val();
                        for (let k of Object.keys(obj)) this.addPostOnTop(obj[k]);
                        callback();
                    });
     * @endcode
     */
    postData(key?: string): firebase.database.Reference {
        if (this.isEmpty(key)) return this.root.ref.child(this.postDataPath);
        else return this.root.ref.child(this.postDataPath).child(key);
    }
    get postDataPath(): string {
        return this.path(POST_DATA_PATH);
    }

    /**
     * Path
     * 
     */
    get postFriendlyUrl(): firebase.database.Reference {
        return this.root.child(POST_FRIENDLY_URL_PATH);
    }


    /**
     * 
     */
    comment(): firebase.database.Reference {
        return this.root.ref.child(COMMENT_PATH);
    }

    ////// EO PATH



    path(p: string) {
        p = this.debugPath + p;
        // console.log(`path: ${p}`);
        return p;
    }




    sanitizePost(post: POST): POST {

        // let d = new Date(post.stamp * 1000);

        // post.date = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();

        return post;
    }






    ////////////////////////////////////
    ////
    ////    POST API
    ////
    ////////////////////////////////////


    /**
     * 
     * @note uid and password are checked here. So, you don't have to check it again if uid provided or password is correct.
     * 
     * @param params User input. `function`, `uid`, `secret` are required.
     * 
     * 
     * @attention Do not call "this.app.forum.api( comment ).then(...)" in front-end. It will give you permission denied.
     */
    api(params): firebase.Promise<any> {

        if (params === void 0) return this.error(ERROR.requeset_is_empty);
        let func = params['function'];
        
        if (allowedApiFunctions.indexOf(func) == -1) return this.error(ERROR.api_that_function_is_not_allowed);

        if (!params['uid']) return this.error(ERROR.uid_is_empty);
        if (this.checkKey(params.uid)) return this.error(ERROR.malformed_key);

        if (!params['secret']) return this.error(ERROR.secret_is_empty);

        return this.getSecretKey(params.uid)
            .then(key => {          /// secret key check for security.
                if (key === params['secret']) {
                    return key;
                } else return this.error(ERROR.secret_does_not_match);
            })
            .then(key => this[func](params));

    }




    // functionName(params) {
    //     let func = '';
    //     if (params['function']) func = params['function'];
    //     else {
    //         if (params['key']) func = 'edit';
    //         else func = 'create';
    //     }
    //     return func;
    // }


    setLastErrorMessage(m) {
        this.lastErrorMessage = m;
        // console.log('------> ERROR: ', m);
    }


    ////////// SEO
    async seo(path) {
        if (!path) return this.error(ERROR.path_is_empty_on_seo);
        let key = path.split('/').pop();

        if (!key) return this.error(ERROR.friendly_url_key_is_empty_on_seo);
        // console.log("key: ", key);
        let html = await this.postFriendlyUrl.child(key).once('value')
            .then(snap => {
                let postKey = snap.val();
                if (postKey === null) {
                    // console.log("postKey is null. key= ", key);
                    return this.error(ERROR.friendly_url_push_key_does_not_exists);
                }
                return this.postData(postKey).once('value').then(snapPostData => {
                    //let key = snapPostData.key;
                    let post = snapPostData.val();
                    // console.log("post: ", post);
                    return this.getSeoHtml(post);
                });
            })

        return html;
    }

    async getSeoHtml(post: POST) {

        let siteName = "SONUB";
        let title = "www.sonub.com - social network hub!";
        let description = "Sonub is a community portal for every one. You will get everything you want. You can get what you are interest in like job, food and mutch more.";
        let author = "sonub";
        let keywords = "Social Network Hub! Discussion, Questions and Answers, Job openings, Buy and sell, Friends";
        let image = "https://www.sonub.com/assets/images/seo/image-meta.png";
        let url = "https://www.sonub.com";
        let key = null;
        let links: string = '';
        let posts = [];

        if (post === null) {
            posts = await this.page({ size: 32 });
        } else {

            title = post.subject ? post.subject : null;
            description = post.content ? post.content.replace(/\s+/g, ' ').substring(0, 255) : null;
            author = post.name ? post.name : null;
            keywords = "Social Network Hub! Discussion, Questions and Answers, Job openings, Buy and sell, Friends";
            image = post.files && post.files.length ? post.files[0] : null;
            url = post.friendly_url_key;
            key = post.key;

            posts = await this.page({ size: 32, key: key });


        }

        for (let p of posts) {
            links += `<a href="https://www.sonub.com/p/${p.friendly_url_key}">${p.subject}</a>`;
        }

        let html = `<!doctype html>
    <head>
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta name="keywords" content="${keywords}">
        `;
        if (author) html += `<meta name="author" content="${author}">`;
        html += `
        <meta itemprop="name" content="${siteName}">
        <meta itemprop="description" content="${description}">
`;

        if (image) html += `<meta itemprop="image" content="${image}">`;

        html += `
        <meta property="og:site_name" content="${siteName}">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${title}">
        <meta property="og:url" content="${url}">
        <meta property="og:description" content="${description}">`;
        if (image) html += `
        <meta property="og:image" content="${image}">`;
        html += `
        <meta http-equiv="refresh" content="0;url=https://www.sonub.com/?p=${key}">
        <style>
            body { background-color: white; color: white; }
            h1 { color: white; }
            a { color: white; }
        </style>
        <script>
            location.href = "https://www.sonub.com/?p=${key}";
        </script>
    </head>
    <body>
        <h1>${title}</h1>
        <article>${description}</article>
        ${links}
    </body>
</html>`;
        return html;
    }




}
