import * as admin from "firebase-admin";
import serviceAccount from "./etc/service-key";

// Admin Key initialization. needs to be done only once. (초기화. 중요. 앱에서 한번만 초기화 해야 한다.)
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sonub-e2b13.firebaseio.com"
});
const db = app.database();


//import { Post, POST } from './model/post';

import { Forum } from './model/forum/forum';
import { POST, CATEGORY, ALL_CATEGORIES, COMMENT } from './interface';
import { ERROR, isError } from './model/error/error';
import * as chalk from 'chalk';
const cheerio = require('cheerio');
const argv = require('yargs').argv;

interface POST_REQUEST { function: string, data: POST };

function datetime() {
  let d = new Date();
  return d.getMonth() + '-' + d.getDate() + ':' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

/**
 * @todo with different user auth. anonymous, user, admin.
 * @see README#TEST AUTH
 */
class AppTest {
  root;
  forum: Forum;
  errorCount: number = 0;
  unexpectedCount: number = 0;
  successCount: number = 0;


  userA = {
    uid: '-push-key-for-user-a',
    name: 'UserA',
    secret: ''
  };

  constructor() {
    this.root = db.ref('/');
    this.forum = new Forum();
    this.forum.setRoot(this.root);
    this.run();
  }

  async run() {



    this.log("TEST BEGIN at: " + (new Date).getMinutes() + ':' + (new Date).getSeconds());

    let re;

    // console.log(argv._);


    await this.prepareTest();
    if (argv._.length == 2 && argv._[0]) {
      await this[argv._[0]]();
    }
    else {
      await this.testIDFormat();
      await this.testCategory();
      await this.testCreateAPost();
      await this.testPost();
      await this.testApi();
      await this.testPostApi();
      await this.testCommentSimple();
      await this.testComment();
      await this.testCommentsTreeToArray();
      await this.testFriendlyUrl();
      await this.testSeo();
    }



    setTimeout(() => {
      console.log(`Tests: ${this.successCount + this.errorCount}, successes: ${this.successCount}, errors: ${this.errorCount}`);
    }, 1000);

  }

  async testIDFormat() {

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

  /**
   * It gets userA's scecret.
   * 
   */
  async prepareTest() {
    console.log("\n =========================== prepareTest() =========================== ")

    // let re = this.forum.functionName({ function: '' });
    // this.expect(re, 'create', `functions name is empty`);

    // re = this.forum.functionName({ function: 'edit' });
    // this.expect(re, 'edit', `functions name is empty`);

    // re = this.forum.functionName({ function: 'delete' });
    // this.expect(re, 'delete', `functions name is empty`);


    // re = this.forum.functionName({ function: 'wrong' });
    // this.expect(re, 'wrong', `functions name is empty`);




    console.log(`prepareTest() ==> generateSecretKey of ${this.userA.uid}` );
    await this.forum.generateSecretKey(this.userA.uid)
      .then(secret => {
        this.userA.secret = secret;
        this.success(`key: ${secret} generated for ${this.userA.name}`);
      })
      .catch(e => {
        console.log("ERROR", e);
        this.error(`generateSecretKey failed`);
      })



  }
  async testCategory() {

    console.log("\n =========================== testCategory() =========================== ")

    let re;

    /// error: create category with empty data.
    await this.forum.createCategory({ id: '' })
      .then(x => this.error('Creating a category with empty data must be failed.'))
      .catch(e => {
        if (e.message == ERROR.malformed_key) this.success("Creating with empty data failed properly failed");
        else this.error("Something happened on creating category with empty data.");
      });


    /// category create. expect: success.
    let category = { id: 'category' + datetime(), name: 'Books' };
    re = await this.forum.createCategory(category)
      .catch(e => e.message);
    this.expect(re, category.id, `Category create ok with: ` + JSON.stringify(category) + ' => ' + this.forum.lastErrorMessage);


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
      this.expect(re, true, `Category 'abc' deleted.`);
    }

    /// create the deleted category.
    let abc_category: CATEGORY = { id: 'abc', name: 'ABC English', description: 'Hello English' };
    re = await this.forum.createCategory(abc_category)
      //.then(x => true)
      .catch(e => e.message);
    this.expect(re, abc_category.id, `Category created with : ` + JSON.stringify(category));


    // create flower category.
    await this.forum.deleteCategory('flower');
    await this.forum.createCategory({ id: 'flower', name: 'Flower category' });




    /// check existence of multiple categories.
    /// expect success.
    let categories = ['abc', category.id];
    re = await this.forum.categoriesExist(categories)
      .catch(e => e.message);
    this.expect(re, true, `Multiple category existence check. All categories exists: ` + categories.toString());





    /// check existence of multiple categories.
    /// expect failure.
    categories = ['abc', 'no-exist-category', category.id];
    re = await this.forum.categoriesExist(categories)
      .catch(e => e.message);
    this.expect(re, ERROR.category_not_exist, `Multiple category extence check. Expect error. A category should not be exists. : ` + categories.toString());



    /// get category data with empty id. expect error.
    await this.forum.getCategory('')
      .then(x => this.error('getCategory() with empty category id must be failed.'))
      .catch(e => {
        if (e.message = ERROR.category_id_empty) this.success("getCategory() with empty id properly failed");
        else this.error("getCategory() with empty category id must be failed with category id empty error.");
      });

    /// get category data. expect succes.
    re = await this.forum.getCategory(abc_category.id)
      .then(x => { this.success(`getCategory() success with: ` + JSON.stringify(x)); return x })
      .catch(e => this.error(`getCategory failed with: ${e}`));

    this.expect(re.id, abc_category.id, `Category id must be ${abc_category.id}`);
    this.expect(re.name, abc_category.name, `Category name must be ${abc_category.name}`);
    this.expect(re.description, abc_category.description, `Category description must be ${abc_category.description}`);



    /// category edit test
    /// category edit with empty id
    await this.forum.editCategory({ id: '' })
      .then(x => this.error('Category edit with empty id must be failed'))
      .catch(e => {
        if (e.message == ERROR.category_id_empty) this.success("Category with empty id failed properly.");
        else this.error(`Something wrong with category edit. It should be failed with category id empty error but: ${e.message}`);
      });
    /// category edit with worng id ( not exisiting id )
    await this.forum.editCategory({ id: 'Oo-wrong-category' })
      .then(x => this.error('Category edit with wrong id must be failed'))
      .catch(e => {
        if (e.message == ERROR.category_not_exist) this.success("Category with wrong id failed properly.");
        else this.error(`Something wrong with category edit. It should be failed with category id not exists error but: ${e.message}`);
      });

    /// category edit and check if it is edited.
    abc_category.description = "description edited.";
    await this.forum.editCategory(abc_category)
      .then(x => this.success('Category edit success'))
      .catch(e => {
        this.error(`Something wrong with category edit. error code : ${e.message}`);
      });
    /// get the category data and compare if edited
    re = await this.forum.getCategory(abc_category.id)
      .then(x => { this.success(`getCategory() success with: ` + JSON.stringify(x)); return x })
      .catch(e => this.error(`getCategory failed with: ${e}`));

    this.expect(re['description'], abc_category.description, "category data properly edited");



    /// get all the categories.
    await this.forum.getCategories()
      .then(categories => {
        if (Array.isArray(categories)) {
          if (categories.length > 1) {
            if (categories[0]['id']) return this.success(`getCategoreis() success. First category id: ` + categories[0]['id']);
          }
        }
        this.error(`getCategories() has no data`);
      })
      .catch(e => {
        this.error(`getCategories() failed with: ${e.message}`);
      });

  }


  /**
   * 
   * Creates a post and returns its created data.
   * 
   * @param category 
   * @param subject 
   * @param uid 
   * @param secret
   * 
   * @return a promise of POST
   */
  async testCreateAPost(category = "abc", subject = " e~ Hhem... This is subject. ^^; ", uid = "This-is-uid", secret = "This-is-secreit", content = '') {
    /// post create and get
    let post: POST = { secret: secret, uid: uid, categories: [category], subject: subject, content: content };
    let key = await this.forum.createPost(post).catch(e => this.error("Post should be created => " + e.message));
    let p = await this.forum.getPostData(key)
      .catch(e => this.error("getPostData() failed with key: " + key));
    return p;
  }


  async testPost() {

    console.log("\n =========================== testPost() =========================== ");


    let p: POST = await this.testCreateAPost('abc', '');
    this.test(p.key, "Post with empty subject has been created with key: " + p.key);



    let ex: boolean = await this.forum.checkPostExists(p.key);
    this.expect(ex, true, "checkPostExists");
    ex = await this.forum.checkPostExists("-wrong-post-key");
    this.expect(ex, false, "checkPostExists properly failed.");


    let re;

    /// create a post with empty data. no category will be an error.
    let post: POST = { uid: '', categories: [], secret: '' };
    re = await this.forum.createPost(post)
      .catch(e => e.message);
    this.expect(re, ERROR.no_categories, `Post Create: No categories` + this.forum.lastErrorMessage);


    /// create a post with wrong category. expect. error.
    post.categories = ['qna', 'no-category', 'movie'];
    re = await this.forum.createPost(post)
      .catch(e => e.message);

    this.expect(re, ERROR.category_not_exist, `Post create : ` + this.forum.lastErrorMessage);

    /// post create with a key should be failed. when you crate a post, there must be no key.
    post.key = '-key-13245abc';
    await this.forum.createPost(post).catch(e => this.expect(e.message, ERROR.post_key_exists_on_create, 'Post create with key properly failed.'));
    post.key = '';


    ///
    post.categories = ['abc'];
    post.subject = "Opo";
    re = await this.forum.createPost(post);
    this.expect(re['message'], void 0, `Post created with key: ${re}`);

    await this.forum.getPostData(re)
      .then((post: POST) => {
        if (post.subject == 'Opo') this.success(`getPostData() success with: ${post.subject}`);
        else this.error(`failed to getPost() : subject is wrong`);
      })
      .catch(e => this.error(e));

    /// post get with wrong key

    await this.forum.getPostData('-12345abc----')
      .then(p => this.error("Wrong post key to get a post must be failed. result: " + JSON.stringify(p)))
      .catch(e => this.expect(e.message, ERROR.post_not_found_by_that_key, "post not found with wrong key properly failed"));



    /// post create and get
    post = { uid: '', categories: ['abc'], subject: "C: " + this.testSubject(), secret: '' };
    let key = await this.forum.createPost(post);
    this.forum.getPostData(key)
      .then((p: POST) => {
        // this.expect( post.subject, 'hi', "Success getPostData()");
        this.expect(p.categories.length, 1, "getPostData() success with: " + JSON.stringify(p));
        this.expect(p.categories[0], 'abc', "category match");
        this.forum.categoryPostRelation().child(p.categories[0]).child(p.key).once('value')
          .then(s => this.expect(s.val(), true, "Post exists under " + p.categories[0] + " category !!"))
      })
      .catch(e => this.error("getPostData() failed with key: " + key));


    /// post edit with no key
    post.key = '';
    await this.forum.editPost(post).then(key => this.error("Post edit with no key must be failed"))
      .catch(e => this.expect(e.message, ERROR.post_key_empty, "Post edit with no key failed."));

    /// post edit with wrong key
    post.key = key + 'wrong';
    await this.forum.editPost(post).then(() => this.error("Post edit with wrong key must be failed"))
      .catch(e => this.expect(e.message, ERROR.post_not_found_by_that_key, "Post edit with wrong key failed."));


    /// post edit with wrong category
    post.key = key;
    post.categories = ['abc', 'flower', 'def'];
    await this.forum.editPost(post)
      .then(key => {
        this.error("Post edit with wrong categroy - must be failed. post data:" + JSON.stringify(post));
      })
      .catch(e => this.expect(e.message, ERROR.category_not_exist, "Post edit with wrong category failed."));



    /// post edit with different category & check if the post does not exist under old category.
    post.categories = ['flower'];
    await this.forum.editPost(post)
      .then(key => {
        this.success("Post edit with different categroy success.");
        this.forum.getPostData(key).then((p: POST) => {
          this.forum.categoryPostRelation().child('flower').child(p.key).once('value')
            .then(s => this.expect(s.val(), true, "Post exists under flower category !!"));
          this.forum.categoryPostRelation().child('abc').child(p.key).once('value')
            .then(s => this.expect(s.val(), null, "Post does not exist under abc category !!"));

        });
      })
      .catch(e => this.error("post edit with different category must success."));


    /// post edit with two category and check if the post exists under the two categories.
    post.categories = ['abc', 'flower'];
    await this.forum.editPost(post)
      .then(key => {
        this.success("Post edit with different categroy success.");
        this.forum.getPostData(key).then((p: POST) => {
          this.forum.categoryPostRelation().child('flower').child(p.key).once('value')
            .then(s => this.expect(s.val(), true, "Post exists under flower category !!"));
          this.forum.categoryPostRelation().child('abc').child(p.key).once('value')
            .then(s => this.expect(s.val(), true, "Post exists under abc category !!"));
        });
      })
      .catch(e => this.error("post edit with different category must success."));


    /// post edit subject, content
    post.subject = "edited !!";
    post.content = "content is edited";
    await this.forum.editPost(post).then(key => {
      this.forum.getPostData(key).then((p: POST) => {
        this.expect(p.subject, post.subject, "Subject edited");
        this.expect(p.content, post.content, "Content edited");
      })
    });



    // delete test.
    let key_flower = await this.forum.createPost({ categories: ['flower'], subject: 'I leave you a flower', uid: '-key-12345a', secret: '' });
    let key_book = await this.forum.createPost({ categories: ['abc'], subject: 'I leave you a book', uid: this.testUid(), secret: '' });

    // category check
    await this.forum.category('abc').child(key_book).once('value').then(x => this.success(`${key_book} exists under abc category`)).catch(e => this.error(e.message));
    await this.forum.category(ALL_CATEGORIES).child(key_book).once('value').then(x => this.success(`${key_book} exists under all category`)).catch(e => this.error(e.message));

    /// delete with no uid, no key
    await this.forum.deletePost({ uid: '', key: key_book }).catch(e => this.expect(e.message, ERROR.uid_is_empty, "deletePost() must have uid"));
    await this.forum.deletePost({ uid: 'a', key: '' }).catch(e => this.expect(e.message, ERROR.post_key_empty, "deletePost() must have key"));

    /// delete with wrong uid
    await this.forum.deletePost({ uid: '-key-wrong-key', key: key_book })
      .then(key => this.error("deletePost() with worng uid must be failed"))
      .catch(e => this.expect(e.message, ERROR.permission_denied, "deletePost() with wrong uid properly failed with permission denied."));

    /// delete
    await this.forum.deletePost({ uid: this.testUid(), key: key_book })
      .then(key => this.success(`deletePost( ${key} ) was sucess with ${key_book}`))
      .catch(e => this.error(`deletePost() failed: ${e.message}`));

    // category check after delete
    await this.forum.category('abc').child(key_book).once('value').then(s => this.expect(s.val(), null, `${key_book} does not exist under abc category`)).catch(e => this.error(e.message));
    await this.forum.category(ALL_CATEGORIES).child(key_book).once('value').then(s => this.expect(s.val(), null, `${key_book} does not exist under all category`)).catch(e => this.error(e.message));









    /// post delete with wrong key
    /// post delete


    /// post like with wrong key
    /// post like

    /// post dislike with wrong key
    /// post dislike

    /// post report with wrong key
    /// post report

  }


  async testApi() {
    await this.forum.api([])
      .catch(e => this.expect(e.message, ERROR.api_function_is_not_provided, "api call without function properly failed."));
    await this.forum.api({ function: '' })
      .catch(e => this.expect(e.message, ERROR.api_function_name_is_empty, "api call with empty function anme properly faield"));

    await this.forum.api({ function: 'wrong' })
      .catch(e => this.expect(e.message, ERROR.api_that_function_is_not_allowed, "api call with wrong function name properly failed"));

  }

  async testPostApi() {

    console.log("\n =========================== testPostApi() =========================== ");

    // await this.forum.postApi({}).catch(e => this.expect(e.message, ERROR.function_is_not_provided, 'function not providing test.'));
    //    await this.forum.postApi({ function: 'no-function-name' }).catch(e => this.expect(e.message, ERROR.requeset_data_is_empty, 'function is give but data is not given.'));

    this.userA.secret = await this.forum.getSecretKey(this.userA.uid)
      .then(key => {
        this.success(`Got key: `);
        return key;
      })
      .catch(e => {
        console.log(e);
        this.error("Failed to get secret key")
      })


    await this.forum.api({
      function: "wrong-function-name",
      uid: this.userA.uid,
      secret: this.userA.secret
    })
      .then(() => { this.error("wrong function name must fail.") })
      .catch(e => this.expect(e.message, ERROR.api_that_function_is_not_allowed, 'Wrong function name test'));



    // create edit. expect error. 'cause no category.
    let post: POST = {
      function: 'createPost',
      subject: 'post create test by api',
      content: 'This is content',
      categories: [],
      uid: this.userA.uid,
      secret: this.userA.secret
    };

    // expect error.
    await this.forum.api(post)
      .then(() => this.error("Calling postApi with no category must be failed."))
      .catch(e => this.expect(e.message, ERROR.no_categories, 'postApi() for creating a post with no category properly failed'));


    // expect error.
    post['categories'] = ['wrong-category'];
    await this.forum.api(post)
      .then(() => this.error("Calling postApi with wrong category must be failed."))
      .catch(e => this.expect(e.message, ERROR.category_not_exist, 'postApi() for creating a post with wrong category properly failed'));

    // expect error: wrong uid
    post.secret = "-a-wrong-secret-key";
    await this.forum.api(post)
      .then(() => this.error("Calling postApi with wrong secret must be failed."))
      .catch(e => this.expect(e.message, ERROR.secret_does_not_match, `'secert does match' properly failed`));


    post.secret = this.userA.secret;

    // expect success.
    post['categories'] = ['abc', 'flower'];
    let key = await this.forum.api(post)
      .then(key => { this.success("Post create with postApi(function:create) success . key: " + key); return key; })
      .catch(e => this.error("A post should be created."));


    // console.log("KEY ===> ", key);

    /// edit with no category
    post.function = 'editPost';
    post.key = key;
    post.categories = [];
    post.subject = "Subject updated...!";
    post.content = "Content updated...!";
    post.secret = this.userA.secret;
    await this.forum.api(post)
      .then(() => this.error("Calling postApi with empty category must be failed."))
      .catch(e => this.expect(e.message, ERROR.no_categories, 'postApi() for editing a post with no category properly failed'));


    /// edit with wrong category
    post.categories = ['abc', 'def', 'flower'];
    await this.forum.api(post)
      .then(() => this.error("Calling postApi with empty category must be failed."))
      .catch(e => this.expect(e.message, ERROR.category_not_exist, 'postApi() for editing a post with wrong category properly failed'));

    /// edit subject/content/category and check
    post.categories = ['abc'];
    await this.forum.api(post)
      .then(key => {
        this.success("Post edit success with: " + key);
        this.forum.getPostData(key).then((p: POST) => {

          this.expect(p.key, post.key, "postApi(function:edit) key match");
          this.expect(p.subject, post.subject, "Subject edit with postApi(function:eidt) success.");
          this.expect(p.content, post.content, "Content edit with postApi(function:eidt) success.");


          this.forum.categoryPostRelation().child('flower').child(p.key).once('value')
            .then(s => this.expect(s.val(), null, "Post does not exist under flower category !!"));
          this.forum.categoryPostRelation().child('abc').child(p.key).once('value')
            .then(s => this.expect(s.val(), true, "Post exists under abc category !!"));

        })
      })
      .catch(e => this.error("Edit should be success."));


    /// edit with wrong post key. expect error
    let newData = Object.assign({}, post);
    newData.key = '-wrong-post-key';
    newData.secret = this.userA.secret;
    await this.forum.api(newData)
      .then(() => this.error("Calling postApi with wrong post key must be failed."))
      .catch(e => this.expect(e.message, ERROR.post_not_found_by_that_key, `'edit' properly failed`));


    /// delete post
    newData.function = 'deletePost';
    newData.key = '-wrong-post-key';
    await this.forum.api(newData)
      .then(() => this.error("Calling postApi for delete with wrong post key must be failed."))
      .catch(e => this.expect(e.message, ERROR.post_not_found_by_that_key, `'delete' properly failed`));

    newData.key = post.key;
    newData.uid = '-wrong-uid';

    await this.forum.api(newData)
      .then(() => this.error("Calling postApi for delete with wrong post key must be failed."))
      .catch(e => this.expect(e.message, ERROR.secret_does_not_match, `'delete' of 'wrong-user' properly failed`));


    newData.uid = post.uid;

    await this.forum.api(newData)
      .then(() => this.success(`delete success`))
      .catch(e => this.error(`'delete' failed`));

    await this.forum.getPostData(post.key)
      .then(() => this.error('post was not deleted'))
      .catch(e => this.expect(e.message, ERROR.post_not_found_by_that_key, 'post poroperly deleted'))



    // @todo
    // post create with key

    // post CRUD by admin.

  }


  async testFriendlyUrl() {

    let subject = " #프랜들리, 유알엘을, 테스트합니다 ^^; " + this.forum.randomString();
    let friendlySubject = this.forum.convertFriendlyUrlString(subject);

    let simple: POST = await this.testCreateAPost("abc", subject);
    this.expect(simple.friendly_url_key, friendlySubject, "Post created with friendly url: ");

    let again: POST = await this.testCreateAPost("abc", subject);
    this.expect(again.friendly_url_key, again.key + '-' + friendlySubject, "Post created with friendly url: ");

  }


  // extras


  testPostData(): POST {
    return {
      key: '',
      uid: this.testUid(),
      subject: this.testSubject(),
      content: this.testContent(),
      categories: this.testCategories(),
      secret: ''
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
    if (a === b) this.success(m + ' ===> a: ' + a + ', b: ' + b);
    else this.error(m + ', a: ' + a + ', b: ' + b);
  }
  test(a, m) {
    if (a) this.success(m);
    else this.error(m);
  }




  /// SEO.

  async testSeo() {


    console.log(" ================= testSeo() ================== ");



    await this.forum.seo('').then(() => this.error("Access seo page with empty url must be faield"), (e) => this.expect(e.message, ERROR.path_is_empty_on_seo, "SEO with empty path failed properly."));

    await this.forum.seo('https://www.sonub.com/').then(() => this.error("Access seo page with empty key must be faield"), (e) => this.expect(e.message, ERROR.friendly_url_key_is_empty_on_seo, "SEO with empty key failed properly."));

    await this.forum.seo("https://www.sonub.com/p/" + "Wrong-friendly-url-test")
      .then(() => this.error("Friedly url with wrong url must be failed"))
      .catch(e => this.expect(e.message, ERROR.friendly_url_push_key_does_not_exists, "Getting friedly url info with wrong url properly failed."));


    // create a post.
    let subject = " #Friendly... URL, Test ..! ^^; " + (new Date()).getMinutes() + (new Date()).getSeconds();
    let friendlySubject = this.forum.convertFriendlyUrlString(subject);

    let post: POST = await this.testCreateAPost("abc", subject);
    this.expect(post.friendly_url_key, friendlySubject, "testSeo() => Post Created: url: " + post.friendly_url_key);


    let url = "https://www.sonub.com/p/" + post.friendly_url_key;
    console.log("Get post from friendly url: ", url);
    let html = await this.forum.seo(url).catch(e => e.messsage);
    const $html = cheerio.load(html)('html');
    this.expect(post.subject, $html.find('title').text(), "Yes. subject maches");


    let post2: POST = await this.testCreateAPost("abc", subject, 'uid', 'secret', `Hi,
    I am content.
    This is content. Tt will be used as description. ^^; #@!^\nFeed\rCarret`);
    this.expect(post2.friendly_url_key, post2.key + '-' + friendlySubject, "testSeo() => Post create another post: url: " + post2.friendly_url_key);
    this.test(post2.friendly_url_key != post.friendly_url_key, "Friendly URL different from post and post2");


    url = "https://www.sonub.com/p/" + post2.friendly_url_key;
    console.log("get post2 : ", url);
    let html2 = await this.forum.seo(url).catch(e => e.messsage);
    const $html2 = cheerio.load(html2)('html');
    this.expect(post2.subject, $html2.find('title').text(), "Yes. subject maches");


    // console.log(html2);

  }





  async testComment() {

    console.log(" ================= testComment() ================== ");

    let post: POST = await this.testCreateAPost('abc', 'This is subject');
    //console.log(post);


    let comment: COMMENT = { function: 'createComment', path: '', uid: this.userA.uid, secret: this.userA.secret, content: 'hi' };
    await this.forum.api(comment)
      .then(key => this.error('create comment with empty ancestors must be failed.'))
      .catch(e => this.expect(e.message, ERROR.path_is_empty_on_create_comment, "create comment with emtpy path properly failed."));


    comment.path = 'a/c/b';
    await this.forum.api(comment)
      .then(key => this.error('create comment must be failed with wrong paht.'))
      .catch(e => this.expect(e.message, ERROR.post_not_found_by_that_key_on_create_comment, "comment create with wrong-path properly failed."));


    // success.
    comment.path = post.key + '/a/c/b';
    let createdPath = await this.forum.api(comment)
      .then(path => {
        this.success("Comment created properly: " + path);
        return path;
      })
      .catch(e => this.error('create comment must be success..'));




    let created: COMMENT = await this.forum.getComments(createdPath);

    // console.log(created);



    let edit: COMMENT = {
      function: 'editComment',
      path: createdPath,
      uid: this.userA.uid,
      secret: this.userA.secret,
      content: 'updated'
    };

    let bPath = edit.path;
    let editedPath = await this.forum.api(edit)
      .then(path => {
        this.expect(path, bPath, "comment edited with proper path");
        return path;
      })
      .catch(e => console.log(e));


    let edited: COMMENT = await this.forum.getComments(editedPath);


    this.expect(createdPath, edited.path, "path are equal after edit");
    this.test(created.content != edited.content, "yes, content updated");
    this.expect(edited.content, "updated", "yes, content is updated");



    let del: COMMENT = {
      function: 'deleteComment',
      path: editedPath,
      uid: this.userA.uid,
      secret: this.userA.secret
    };



    let deletedPath = await this.forum.api(del)
      .then(path => {
        this.success("comment deleted");
        return path;
      })
      .catch(e => console.log(e));

    this.expect(createdPath, editedPath, "created Path and edited Path matches");
    this.expect(editedPath, deletedPath, "deleted Path and edited Path matches");


    let deletedComment = await this.forum.getComments(editedPath)
      .then(data => this.expect(data, null, "comment null after get. it is properly deleted."))
      .catch(e => console.log(e));



    // create => comment => comment => comment


    let fruit: POST = await this.testCreateAPost('abc', 'This is a fruit');
    let apple: COMMENT = {
      function: 'createComment',
      path: fruit.key,
      uid: this.userA.uid,
      content: "This is blue apple."
    };
    let blueApplePath = await this.forum.createComment(apple)
      .catch(e => this.error(e.message));

    let blueApple: COMMENT = await this.forum.getComments(blueApplePath);
    this.expect(apple.content, blueApple.content, "comment created. content matches: " + blueApplePath);


    let smallBlueApple: COMMENT = {
      function: 'createComment',
      path: blueApplePath,
      uid: this.userA.uid,
      content: "This is small blue apple."
    }

    let smallBlueApplePath = await this.forum.createComment(smallBlueApple)
      .catch(e => this.error(e.message));

    // console.log("smallBlueApplePath: ", smallBlueApplePath);



    let createdSmallBlueApple: COMMENT = await this.forum.getComments(smallBlueApplePath).catch(e => this.error(e.message));

    let arr = createdSmallBlueApple.path.split('/');
    let popSmallBlueAppleKey = arr.pop();
    this.expect(arr.join('/'), blueApplePath, "yes, path matches");


    let apples: COMMENT = await this.forum.getComments(blueApplePath);
    // console.log(apples);

    let childComment: COMMENT = apples[popSmallBlueAppleKey];
    this.expect(createdSmallBlueApple.content, childComment.content, "Nested comment compare ok");












  }
  async testCommentsTreeToArray() {

    let begin: POST = await this.testCreateAPost('abc', 'Begin');
    // console.log(begin);

    let p = begin.key;

    console.log("Going to create comments for order test. it will take some time....");
    let pathA = await this.createAComment( p, 'A' );
    let pathB = await this.createAComment( p, 'B' );
    let pathC = await this.createAComment( p, 'C' );

    let pathBA = await this.createAComment( pathB, 'BA');
    let pathBA1 = await this.createAComment( pathBA, 'BA1');
    let pathBA2 = await this.createAComment( pathBA, 'BA2');
    
    let pathBA1A = await this.createAComment( pathBA1, "BA1A" );


    let pathD = await this.createAComment( p, 'D' );
    let pathD1 = await this.createAComment( pathD, 'D1' );
    let pathD2 = await this.createAComment( pathD, 'D2' );
    let pathD2A = await this.createAComment( pathD2, 'D2A' );
    let pathD2A1 = await this.createAComment( pathD2A, 'D2A1' );
    let pathD2A1A = await this.createAComment( pathD2A1, 'D2A1A' );
    let pathD2A2 = await this.createAComment( pathD2A, 'D2A2' );
    let pathD2B = await this.createAComment( pathD, 'D2B' );
    let pathD3 = await this.createAComment( pathD, 'D3' );
    let pathD4 = await this.createAComment( pathD, 'D4' );
    




    let pathE = await this.createAComment( p, 'E' );
    let pathF = await this.createAComment( p, 'F' );
    let pathG = await this.createAComment( p, 'G' );
    let pathH = await this.createAComment( p, 'H' );
    let pathI = await this.createAComment( p, 'I' );
    let pathJ = await this.createAComment( p, 'J' );


    let pathBA1B = await this.createAComment( pathBA1, "BA1B" );


    let pathD2A1A1 = await this.createAComment( pathD2A1, 'D2A1A1' );
    let pathD2A1A1a = await this.createAComment( pathD2A1A1, 'D2A1A1-a' );
    let pathD2A1A1b = await this.createAComment( pathD2A1A1, 'D2A1A1-b' );
    let pathD2A1A1c = await this.createAComment( pathD2A1A1, 'D2A1A1-c' );
    let pathD2A1A1d = await this.createAComment( pathD2A1A1, 'D2A1A1-d' );

    

    let comments = await this.forum.getComments(begin.key).catch(e => this.error(e.message));
    
    this.expect( Object.keys(comments).length, 10, "root comments are created properly.");

    let res = this.forum.commentsTreeToArray( comments );


    // console.log(res);
    let contents = [];

    for ( let p of res ) {
      contents.push( p.content );
    }


    contents.sort();
    let match = true;
    for ( let i = 0 ; i < contents.length; i ++ ) {
      if ( contents[ i ] != res[i]['content'] ) {
        console.log( `${contents[i]} != ${res[i]['content']}` );
        match = false;
      }
    }

    this.test( match, "All replies are in order.");
    
  }


  async testCommentSimple() {
    let p = await this.createAComment('-KohAgezTF-yX6skgQVM', 'Simple 1' ).catch( e => this.error( e.message ) );
    this.test( p, "Comment created with: " + p);

  }


  createAComment(path, content): firebase.Promise<any> {
    let BA1: COMMENT = {
      function: 'createComment',
      path: path,
      uid: this.userA.uid,
      content: content
    };
    return this.forum.createComment(BA1)
      .catch(e => this.error(e.message));

  }
}



new AppTest();
