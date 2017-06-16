import * as admin from "firebase-admin";
import serviceAccount from "./etc/test-service-key";
// Admin Key 초기화. 중요. 앱에서 한번만 초기화 해야 한다.
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-ec3e3.firebaseio.com"
});
const db = app.database();

//import { Post, POST } from './model/post';

import { Forum } from './model/forum/forum';
import { POST, CATEGORY } from './model/forum/forum.interface';
import { ERROR, isError } from './model/error/error';
import * as chalk from 'chalk';

function datetime() {
  let d = new Date();
  return d.getMonth() + '-' + d.getDate() + ':' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

/**
 * @todo with different user auth. anonymous, user, admin.
 * 
 */
class AppTest {

  root;
  forum: Forum;
  errorCount: number = 0;
  unexpectedCount: number = 0;
  successCount: number = 0;
  constructor() {
    this.root = db.ref('/');
    this.forum = new Forum(this.root);
    this.forum.debugPath = 'a/';
    this.run();
  }

  async run() {

    this.log("TEST BEGIN at: " + (new Date).getMinutes() + ':' + (new Date).getSeconds() );

    let re;

    // await this.testCategoryIDFormat();
    await this.testCategory();
    await this.testPost();


    // user test
    // user auth test each different users.
    // user block test

    console.log( `Tests: ${ this.successCount + this.errorCount }, successes: ${ this.successCount }, errors: ${ this.errorCount }`);
  }


  async testCategoryIDFormat() {

    let re;
    re = await this.forum.createCategory({ id: 'abc#def', name: 'is error' }).catch(e => e.message);
    this.expect(re, ERROR.malformed_key, `category id(push key) with # is malformed.`);

    re = await this.forum.createCategory({ id: 'abc.def', name: 'is error' }).catch(e => e.message);
    this.expect(re, ERROR.malformed_key, `category id(push key) with . is malformed.`);

    re = await this.forum.createCategory({ id: 'abc/def', name: 'is error' }).catch(e => e.message);
    this.expect(re, ERROR.malformed_key, `category id(push key) with [ is malformed.`);

    re = await this.forum.createCategory({ id: 'abc[def', name: 'is error' }).catch(e => e.message);
    this.expect(re, ERROR.malformed_key, `category id(push key) with [ is malformed.`);

    re = await this.forum.createCategory({ id: 'abc]def', name: 'is error' }).catch(e => e.message);
    this.expect(re, ERROR.malformed_key, `category id(push key) with [ is malformed.`);

    re = await this.forum.createCategory({ id: '', name: 'Books' })
      .then(x => true)
      .catch(e => e.message);
    this.expect(re, ERROR.malformed_key, `category with no id create test`);

  }

  async testCategory() {

    let re;

    /// error: create category with empty data.
    await this.forum.createCategory( { id: '' } )
      .then( x => this.error( 'Creating a category with empty data must be failed.' ) )
      .catch( e => {
        if ( e.message == ERROR.malformed_key ) this.success("Creating with empty data failed properly failed");
        else this.error("Something happened on creating category with empty data.");
      });


    /// category create. expect: success.
    let category = { id: 'category' + datetime(), name: 'Books' };
    re = await this.forum.createCategory(category)
      // .then(x => true)
      .catch(e => e.message);
    this.expect(re, category.id, `Category create ok with: ` + JSON.stringify(category) + ' => ' + this.forum.lastErrorMessage );


    /// check if same category exists on 'creating category'. expect error.
    re = await this.forum.createCategory(category)
      .then(x => true)
      .catch(e => e.message);
    this.expect(re, ERROR.category_exists, `Category already exists with : ` + JSON.stringify(category));


    /// check if a category exists or not. expect: success.
    re = await this.forum.categoryExists(category.id).catch(e => e.message);
    this.expect(re, true, `Category exists`);


    /// check if a category exists or not. expect: error.
    re = await this.forum.categoryExists('abc').catch(e => e.message);

    /// if a category exists, delete.
    if (re === true) {
      this.log("abc category exists. goint to delete");
      re = await this.forum.deleteCategory('abc').then(x => true).catch(e => e.message);
      this.expect( re, true, `Category 'abc' deleted.`);
    }

    /// create the deleted category.
    let abc_category: CATEGORY = { id: 'abc', name:'ABC English', description: 'Hello English' };
    re = await this.forum.createCategory( abc_category )
      //.then(x => true)
      .catch(e => e.message);
    this.expect(re, abc_category.id, `Category created with : ` + JSON.stringify(category));


    /// check existence of multiple categories.
    /// expect success.
    let categories = [ 'abc', category.id ];
    re = await this.forum.categoriesExist( categories )
      .catch( e => e.message );
    this.expect( re, true, `Multiple category existence check. All categories exists: ` + categories.toString() );
    
    /// check existence of multiple categories.
    /// expect failure.
    categories = [ 'abc', 'no-exist-category', category.id ];
    re = await this.forum.categoriesExist( categories )
      .catch( e => e.message );
    this.expect( re, ERROR.category_not_exist, `Multiple category extence check. Expect error. A category should not be exists. : ` + categories.toString() );
    


    /// get category data with empty id. expect error.
    await this.forum.getCategory('')
      .then( x => this.error('getCategory() with empty category id must be failed.') )
      .catch( e => {
        if ( e.message = ERROR.category_id_empty ) this.success("getCategory() with empty id properly failed");
        else this.error("getCategory() with empty category id must be failed with category id empty error.");
      });

    /// get category data. expect succes.
    re = await this.forum.getCategory( abc_category.id )
      .then( x => { this.success(`getCategory() success with: ` + JSON.stringify(x)); return x } )
      .catch( e => this.error(`getCategory failed with: ${e}`));
    
    this.expect( re.id, abc_category.id, `Category id must be ${abc_category.id}`);
    this.expect( re.name, abc_category.name, `Category name must be ${abc_category.name}`);
    this.expect( re.description, abc_category.description, `Category description must be ${abc_category.description}`);



    /// category edit test
    /// category edit with empty id
    await this.forum.editCategory({id:''})
      .then( x => this.error('Category edit with empty id must be failed'))
      .catch( e => {
        if ( e.message == ERROR.category_id_empty ) this.success("Category with empty id failed properly.");
        else this.error(`Something wrong with category edit. It should be failed with category id empty error but: ${e.message}`);
      });
    /// category edit with worng id ( not exisiting id )
    await this.forum.editCategory({id:'Oo-wrong-category'})
      .then( x => this.error('Category edit with wrong id must be failed'))
      .catch( e => {
        if ( e.message == ERROR.category_not_exist ) this.success("Category with wrong id failed properly.");
        else this.error(`Something wrong with category edit. It should be failed with category id not exists error but: ${e.message}`);
      });

    /// category edit and check if it is edited.
    abc_category.description = "description edited.";
    await this.forum.editCategory( abc_category )
      .then( x => this.success('Category edit success'))
      .catch( e => {
        this.error(`Something wrong with category edit. error code : ${e.message}`);
      });
    /// get the category data and compare if edited
    re = await this.forum.getCategory( abc_category.id )
      .then( x => { this.success(`getCategory() success with: ` + JSON.stringify(x)); return x } )
      .catch( e => this.error(`getCategory failed with: ${e}`));
    
    this.expect( re['description'], abc_category.description, "category data properly edited");
    
    /// get all the categories.
    await this.forum.getCategories()
      .then( categories => {
        if ( Array.isArray( categories ) ) {
          if ( categories.length > 1 ) {
            if ( categories[0]['id'] ) return this.success(`getCategoreis() success. First category id: ` + categories[0]['id']);
          }
        }
        this.error(`getCategories() has no data`);
       })
      .catch( e => {
        this.error(`getCategories() failed with: ${e.message}`);
      });

  }


  async testPost() {

    let re;

    /// create a post with empty data. no category will be an error.
    let post: POST = {};
    re = await this.forum.createPost(post)
      .catch(e => e.message);
    this.expect(re, ERROR.no_categories, `Post Create: No categories` + this.forum.lastErrorMessage);


    /// create a post with wrong category. expect. error.
    post.categories = ['qna', 'no-category', 'movie'];
    re = await this.forum.createPost(post)
      .catch(e => e.message);
    
    this.expect(re, ERROR.category_not_exist, `Post create : ` + this.forum.lastErrorMessage );

    post.categories = ['abc'];
    post.subject = "Opo";
    re = await this.forum.createPost(post);
    this.expect( re['message'], void 0, `Post created with key: ${re}` );

    await this.forum.getPostData( re )
      .then((post:POST) => {
        if ( post.subject == 'Opo' ) this.success(`getPostData() success with: ${post.subject}`);
        else this.error(`failed to getPost() : subject is wrong`);
      })
      .catch( e => this.error(e) );

    /// post get with wrong key
    /// post get

    /// post edit with wrong key
    /// post edit

    /// post delete with wrong key
    /// post delete


    /// post like with wrong key
    /// post like
    /// post dislike with wrong key
    /// post dislike

    /// post report with wrong key
    /// post report

  }


  // extras


  testPostData(): POST {
    return {
      uid: this.testUid(),
      subject: this.testSubject(),
      content: this.testContent(),
      categories: this.testCategories()
    };
  }

  testSubject(): string {
    let d = new Date();
    return 'SUBJECT: ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
  }

  testContent(): string {
    let d = new Date();
    return 'TEST CONTENT' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
  }

  testUid(): string {
    return '0PNzxFcsyiQ4LqOXPLtYbgFtgTw1';
  }

  testCategories() {
    return ['movie', 'no-exists'];
  }

  testCreateCategory() {
    return [
      { id: 'movie', name: 'Movie', description: "Let's go to Movie!", owner: 'thruthesky' },
      { id: 'music', name: 'Music', description: "Play music", owner: 'eunsu' },
      { id: 'play', name: 'Play', description: "Play with me", owner: 'thruthesky' },
      { id: 'game', name: 'Game', description: "Lineage game!", owner: 'lineage' }
    ];
  }



  success(m) {
    this.successCount++;
    console.log(`----> SUCCESS (${this.successCount}) : `, m);
  }
  error(m) {
    this.errorCount++;
    let e = chalk.white.bgRed.bold(' ERROR ');
    console.log(`----> ${e} (${this.errorCount}) : `, m);
  }

  unexpected(m) {
    this.unexpectedCount++;
    console.log(`----> UNEXPECTED (${this.errorCount}) : `, m);
  }

  log(m) {
    console.log(`----> LOG : `, m);
  }

  expect(a, b, m) {
    // console.log("a:", a, "b:", b);
    if (a == b) this.success(m + ' ===> a: ' + a + ', b: ' + b);
    else this.error(m + ', a: ' + a + ', b: ' + b);
  }


}


new AppTest();
