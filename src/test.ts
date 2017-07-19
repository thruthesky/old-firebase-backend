import * as admin from "firebase-admin";
import serviceAccount from "./etc/service-key";

// Admin Key initialization. needs to be done only once. (초기화. 중요. 앱에서 한번만 초기화 해야 한다.)
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sonub-e2b13.firebaseio.com"
});

const db = app.database();


//import { Post, POST } from './model/post';

import { Base } from './model/base/base';
import { Forum } from './model/forum/forum';

import { BackendApi } from './model/api/backend';

import { POST, POST_CREATE, POST_EDIT, CATEGORY, ALL_CATEGORIES, COMMENT } from './interface';
import { ERROR, isError } from './model/error/error';

import { AdvertisementToolInterface } from './model/advertisement-tool/advertisement-tool-interface';

import * as chalk from 'chalk';
const cheerio = require('cheerio');
const argv = require('yargs').argv;

const request = require('request');



const datetime = () => {
  let d = new Date();
  return d.getMonth() + '-' + d.getDate() + ':' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

/**
 * @todo with different user auth. anonymous, user, admin.
 * @see README#TEST AUTH
 */
class AppTest {
  root;
  base: Base;
  forum: Forum;
  adv: AdvertisementToolInterface;
  errorCount: number = 0;
  unexpectedCount: number = 0;
  successCount: number = 0;


  userA = {
    uid: '-push-key-for-user-a',
    name: 'UserA',
    secret: ''
  };

  
  userB = {
    uid: '-push-key-for-user-b',
    name: 'UserB',
    secret: ''
  };

  
  
  userC = {
    uid: '-push-key-for-user-c',
    name: 'UserC',
    secret: ''
  };

  

  constructor() {
    this.root = db.ref();
    this.base = new Base();
    this.forum = (new Forum()).setRoot(this.root);
    this.adv = (new AdvertisementToolInterface()).setRoot(this.root);
    this.run();
  }

  async run() {

    this.log("TEST BEGIN at: " + (new Date).getMinutes() + ':' + (new Date).getSeconds());

    let re;

    // console.log(argv._);

    await this.prepareTest();

    if (argv._.length == 2 && argv._[0]) {
      let method: string = argv._[0];
      // if (method.toLowerCase().indexOf('cloud') == -1) await this.prepareTest();
      await this[argv._[0]]();
    }
    else {
      // await this.prepareTest();
      await this.testIDFormat();
      await this.testCategory();
      await this.testCreateAPost();
      await this.testPost();
      await this.testApi();
      await this.testBackendApi();
      await this.testBackendPost();
      await this.testCreateCommentsWithModel();
      await this.testCommentSimple();
      await this.testComment();
      await this.testCommentsTreeToArray();


      await this.test_getParentUids();
      await this.test_getParentTokens();

      /// cloud test things should be in the middle since they are using callbacks.
      /// it uses set timeout to wait to finish.
      this.testCloudFunctionsPost(); ///
      this.testCloudFunctions(); /// it is not promise



      await this.testFriendlyUrl();
      await this.testSeo();
      await this.testAdv();
    }

    setTimeout(() => {
      console.log(`Tests: ${this.successCount + this.errorCount}, successes: ${this.successCount}, errors: ${this.errorCount}`);
    }, 5000);

  }


  /**
   * 
   * Use this to test the real backend environemnt.
   * @note You must also do 'unit-test' on indivisual mehtods.
   * 
   * @param body User input to call backend.
   * @param send Callback with return data from backend.
   * 
   * @warning @attention When you are going to call BackendApi::run(), you cannot use 'async' or 'Promise' since it uses callback.
   * @warning @attention BackendApi::run() will be triggered by web browser and the result will be sent back to browser using 'Express::resopnse'
   * 
   */
  backend(body, send) {
    let req = { body: body };
    let res = { send: send };
    (new BackendApi(this.root, req, res)).run();
  }
  backendExpect(body, ex, msg?, callback?) {
    this.backend(body, res => {
      this.expect(this.base.errcode(res), ex, msg || '');
      if (callback) callback(res);
    });
  }
  backendExpectSuccess(body, msg?, callback?) {
    this.backend(body, res => {
      this.test(this.base.errcode(res) == null, msg || '');
      if (callback) callback(res);
    });
  }
  backendExpectKey(body, msg?, callback?) {
    this.backend(body, res => {
      this.test(this.isPushKey(res.data), msg);
      if (callback) callback(res.data);
      // if (callback) callback(res.data);
    });
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
    console.log("\n =========================== prepareTest() =========================== ");


    console.log(`prepareTest() ==> generateSecretKey of ${this.userA.uid}`);
    await this.forum.generateSecretKey(this.userA.uid)
      .then(secret => {
        this.userA.secret = secret;
        this.success(`key: ${secret} generated for ${this.userA.name}`);
      })
      .catch(e => {
        console.log("ERROR", e);
        this.error(`generateSecretKey failed`);
      });


      await this.forum.generateSecretKey(this.userB.uid)
      .then(secret => {
        this.userB.secret = secret;
        this.success(`key: ${secret} generated for ${this.userB.name}`);
      })
      .catch(e => {
        console.log("ERROR", e);
        this.error(`generateSecretKey failed`);
      });

      await this.forum.generateSecretKey(this.userC.uid)
      .then(secret => {
        this.userC.secret = secret;
        this.success(`key: ${secret} generated for ${this.userC.name}`);
      })
      .catch(e => {
        console.log("ERROR", e);
        this.error(`generateSecretKey failed`);
      });


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
    let post: POST_CREATE = { secret: secret, uid: uid, categories: [category], subject: subject, content: content };
    // console.log(post);
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
    console.log("\n =========================== testApi() =================================");

  }

  async testBackendApi() {
    this.backend({}, res => {
      this.expect(this.base.errcode(res), ERROR.api_route_is_not_provided, "api call without route properly failed.");
    });


    this.backend({ route: '' }, res => {
      this.expect(this.base.errcode(res), ERROR.api_route_is_empty, "api call with empty route name properly faield");
    });

    this.backend({ route: 'wrongRoute', uid: '-wrong-uid', secret: '-wrong-secret' }, res => {
      this.expect(this.base.errcode(res), ERROR.api_route_not_exsit, "api call with wrong route name properly failed");
    });

    this.backend({ route: 'wrongRoute', secret: '-wrong-secret' }, res => {
      this.expect(this.base.errcode(res), ERROR.uid_is_empty, "api call with wrong route name properly failed");
    });


    this.backend({ route: 'wrongRoute', uid: '-wrong-uid' }, res => {
      this.expect(this.base.errcode(res), ERROR.secret_is_empty, "api call with wrong route name properly failed");
    });

    this.backend({ route: 'forum.version', uid: '-wrong-uid', secret: 'secret' }, res => {
      this.expect(this.base.errcode(res), ERROR.secret_does_not_match, "wrong uid & secret");
    });

  }


  testCloudFunctionsPost() {

    console.log("\n =========================== testCloudFunctionsPost() =========================== ");



    // create edit. expect error. 'cause no category.
    let post: POST = {
      route: 'createPost',
      subject: 'post create test by api',
      content: 'This is content',
      categories: [],
      uid: this.userA.uid,
      secret: this.userA.secret
    };

    // expect error.
    post['categories'] = ['wrong-category'];
    this.backendExpect(post, ERROR.category_not_exist, 'postApi() for creating a post with wrong category properly failed', res => {
      post['categories'] = ['abc'];
      post['secret'] = '-wrong-secret';
      this.backendExpect(post, ERROR.secret_does_not_match, 'wrong secret', res => {

        post.secret = this.userA.secret;
        this.backendExpectKey(post, 'post create', key => {
          post.route = 'forum.editPost';
          post.key = key;
          post.categories = [];
          post.subject = "Subject updated...!";
          post.content = "Content updated...!";
          post.secret = this.userA.secret;
          post.categories = ['-wrong-category-abc', 'def', 'flower'];
          this.backendExpect(post, ERROR.category_not_exist, '', res => {
            post.categories = ['abc'];
            // console.log(post);
            this.backend(post, res => {
              // console.log('---------------');
              // console.log(res);
              // let p = JSON.parse(res);
              this.forum.getPostData(res.data).then((p: POST) => {

                this.expect(p.key, post.key, "postApi(route:edit) key match");
                this.expect(p.subject, post.subject, "Subject edit with postApi(route:eidt) success.");
                this.expect(p.content, post.content, "Content edit with postApi(route:eidt) success.");

                this.forum.categoryPostRelation().child('flower').child(p.key).once('value')
                  .then(s => this.expect(s.val(), null, "Post does not exist under flower category !!"));
                this.forum.categoryPostRelation().child('abc').child(p.key).once('value')
                  .then(s => this.expect(s.val(), true, "Post exists under abc category !!"));


                // /// edit with wrong post key. expect error
                let newData = Object.assign({}, post);
                newData.key = '-wrong-post-key';
                newData.secret = this.userA.secret;
                this.backendExpect(newData, ERROR.post_not_found_by_that_key, '', res => {

                  /// delete post
                  newData.key = post.key;
                  newData.uid = '-wrong-uid';
                  this.backendExpect(newData, ERROR.secret_does_not_match, '', res => {
                    newData.uid = post.uid;
                    this.backendExpectSuccess(newData, 'post deleted');
                  });

                });
              });

            });
          });

        });
      });

    });







  }

  async testBackendPost() {

    console.log("\n ====================== testBackendPost() =========================");
    let body = {};
    await this.backend(body, re => this.expect(this.base.errcode(re), ERROR.api_route_is_not_provided, "route not provided"));
    body['route'] = '';
    await this.backend(body, re => this.expect(re['code'], ERROR.api_route_is_empty, "empty route"));
    body['route'] = 'wrong_route_name is not allowed';
    await this.backend(body, re => this.expect(this.base.getErrorCode(re), ERROR.uid_is_empty, "Empty uid: " + this.base.parseError(re['code']).extra));


    body['route'] = 'createPost';
    body['uid'] = this.userA.uid;
    await this.backend(body, re => this.expect(re['code'], ERROR.secret_is_empty, "empty secret"));
    body['secret'] = this.userA.secret;




    body['route'] = 'forum.createPost';
    await this.backend(body, re => {
      // console.log(re);
      this.expect(re['code'], ERROR.no_categories, "No category");
    });

    /// Break reference from 'body'
    let p2 = Object.assign({}, body);
    p2['categories'] = ['abc'];
    p2['subject'] = "Create test with Backend.";
    console.log("Going to create");

    /// create
    this.backend(p2, re => {
      if (this.isPushKey(re['data'])) {
        this.success("Post created with: " + re.data);

        /// get through front-end
        this.forum.getPostData(re.data)
          .then(p => {

            /// edit
            let edit: POST = {
              route: 'forum.editPost',
              uid: this.userA.uid,
              secret: this.userA.secret,
              categories: ['abc']
            };
          })
          .catch(e => this.error('create failed: ' + e.message));

      }
      else {
        this.error("Post create failed:");
        return null;
      }
    });





    console.log("finish testBackendPost() before callback?");

    return;
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

    // console.log(" ================= testComment() ================== ");

    let post: POST = await this.testCreateAPost('abc', 'This is subject');


    let comment: COMMENT = { route: 'createComment', path: '', uid: this.userA.uid, secret: this.userA.secret, content: 'hi' };
    this.backendExpect(comment, ERROR.path_is_empty_on_create_comment, '', res => {
      comment.path = 'a/c/b';
      this.backendExpect(comment, ERROR.post_not_found_by_that_key_on_create_comment, '', res => {
        comment.path = post.key + '/a/c/b';
        this.backendExpectSuccess(comment, 'create a comment.', res => {
          let createdPath = res.data;
          this.forum.getComments(createdPath).then((c0: COMMENT) => {
            this.expect(c0.path, comment.path, "Patch match");



            let edit: COMMENT = {
              route: 'editComment',
              path: createdPath,
              uid: this.userA.uid,
              secret: this.userA.secret,
              content: 'updated'
            };

            this.backendExpectSuccess(edit, 'comment edit', res => {
              this.forum.getComments(createdPath).then((edited: COMMENT) => {
                this.expect(createdPath, edited.path, "path are equal after edit");
                this.test(c0.content != edited.content, "yes, content updated");
                this.expect(edited.content, "updated", "yes, content is updated");

                let del: COMMENT = {
                  route: 'deleteComment',
                  path: edited.path,
                  uid: this.userA.uid,
                  secret: this.userA.secret
                };
                this.backendExpectSuccess(del, 'delete', res => {
                  this.expect(c0.path, res.data, "created Path and deleted Path matches");

                  this.forum.getComments(c0.path).then((comment: COMMENT) => {
                    this.expect(comment, null, "comment deleted");
                  }).catch(e => this.error(e.message));


                })




              });




            });



          });
        });
      });
    });











  }


  async testCreateCommentsWithModel() {


    // create => comment => comment => comment

    let fruit: POST = await this.testCreateAPost('abc', 'This is a fruit');
    let apple: COMMENT = {
      route: 'createComment',
      path: fruit.key,
      uid: this.userA.uid,
      content: "This is blue apple."
    };
    let blueApplePath = await this.forum.createComment(apple)
      .catch(e => this.error(e.message));

    let blueApple: COMMENT = await this.forum.getComments(blueApplePath);
    this.expect(apple.content, blueApple.content, "comment created. content matches: " + blueApplePath);


    let smallBlueApple: COMMENT = {
      route: 'createComment',
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

  async test_getParentUids() {

    let begin: POST = await this.testCreateAPost('abc', 'push test', '-uid-push-test');
    let p = begin.key;

    let pathA = await this.createAComment(p, 'A');
    let pathB = await this.createAComment(p, 'B');
    let pathC = await this.createAComment(p, 'C');

    let pathBA = await this.createAComment(pathB, 'BA', this.userB.uid, this.userB.secret);
    let pathBA1 = await this.createAComment(pathBA, 'BA1');
    let pathBA2: string = await this.createAComment(pathBA, 'BA2');
    let pathBA2A: string = await this.createAComment(pathBA2, 'BA2A', this.userC.uid, this.userC.secret);

    // console.log("pathBA2A: ", pathBA2A);

    // let paths = pathBA2.split('/');
    

    let uids = await this.forum.getParentUids( pathBA2A );


    this.test( uids.length == 3, "3 uids" );
    this.test( uids[0] == '-uid-push-test', 'push test uid ok' );
    this.test( uids[1] == this.userA.uid, 'user a uid');
    this.test( uids[2] == this.userB.uid, 'user b uid');


    let uidsIncludeSelf = await this.forum.getParentUids( pathBA2A, true );
    this.test( uidsIncludeSelf.length == 4, "4 uids including self" );
    this.test( uidsIncludeSelf[3] == this.userC.uid, 'user c uid');
    console.log(uidsIncludeSelf);

  }

  async test_getParentTokens() {

    await this.forum.updateToken( this.userA.uid, 'tokenA' );
    await this.forum.updateToken( this.userC.uid, 'tokenC' );

    let begin: POST = await this.testCreateAPost('abc', 'push test', this.userA.uid );
    let p = begin.key;

    let pathA = await this.createAComment(p, 'A');
    let pathAA = await this.createAComment(pathA, 'AA', this.userB.uid, this.userB.secret);
    let pathAAA = await this.createAComment(pathAA, 'AAA', this.userA.uid, this.userA.secret);
    let pathAAAA = await this.createAComment(pathAAA, 'AAAA', this.userC.uid, this.userC.secret);

    let tokens = await this.forum.getParentTokens( pathAAAA );

    this.expect( tokens.length, 1, "token no. 1");
    this.expect( tokens[0], 'tokenA', "token A");


    tokens = await this.forum.getParentTokens( pathAAAA, true );
    this.expect( tokens.length, 2, "token no. 2");
    this.expect( tokens[0], 'tokenA', "token A");
    this.expect( tokens[1], 'tokenC', "token C");

    
    let pathAAAAA = await this.createAComment(pathAAAA, 'AAAAA', '-user-A4'); // token not exists.
    tokens = await this.forum.getParentTokens( pathAAAAA, true );
    this.expect( tokens.length, 2, "token no. 2");


  }


  









  async testCommentsTreeToArray() {

    let begin: POST = await this.testCreateAPost('abc', 'Begin');
    // console.log(begin);

    let p = begin.key;

    console.log("Going to create comments for order test. it will take some time....");
    let pathA = await this.createAComment(p, 'A');
    let pathB = await this.createAComment(p, 'B');
    let pathC = await this.createAComment(p, 'C');

    let pathBA = await this.createAComment(pathB, 'BA');
    let pathBA1 = await this.createAComment(pathBA, 'BA1');
    let pathBA2 = await this.createAComment(pathBA, 'BA2');

    let pathBA1A = await this.createAComment(pathBA1, "BA1A");


    let pathD = await this.createAComment(p, 'D');
    let pathD1 = await this.createAComment(pathD, 'D1');
    let pathD2 = await this.createAComment(pathD, 'D2');
    let pathD2A = await this.createAComment(pathD2, 'D2A');
    let pathD2A1 = await this.createAComment(pathD2A, 'D2A1');
    let pathD2A1A = await this.createAComment(pathD2A1, 'D2A1A');
    let pathD2A2 = await this.createAComment(pathD2A, 'D2A2');
    let pathD2B = await this.createAComment(pathD, 'D2B');
    let pathD3 = await this.createAComment(pathD, 'D3');
    let pathD4 = await this.createAComment(pathD, 'D4');


    let pathE = await this.createAComment(p, 'E');
    let pathF = await this.createAComment(p, 'F');
    
    let pathG = await this.createAComment(p, 'G');
    let pathH = await this.createAComment(p, 'H');
    let pathI = await this.createAComment(p, 'I');
    let pathJ = await this.createAComment(p, 'J');


    let pathBA1B = await this.createAComment(pathBA1, "BA1B");


    let pathD2A1A1 = await this.createAComment(pathD2A1, 'D2A1A1');
    let pathD2A1A1a = await this.createAComment(pathD2A1A1, 'D2A1A1-a');
    let pathD2A1A1b = await this.createAComment(pathD2A1A1, 'D2A1A1-b');
    let pathD2A1A1c = await this.createAComment(pathD2A1A1, 'D2A1A1-c');
    let pathD2A1A1d = await this.createAComment(pathD2A1A1, 'D2A1A1-d');



    let comments = await this.forum.getComments(begin.key).catch(e => this.error(e.message));

    this.expect(Object.keys(comments).length, 10, "root comments are created properly.");

    let res = this.forum.commentsTreeToArray(comments);


    // console.log(res);
    let contents = [];

    for (let p of res) {
      contents.push(p.content);
    }


    contents.sort();
    let match = true;
    for (let i = 0; i < contents.length; i++) {
      if (contents[i] != res[i]['content']) {
        console.log(`${contents[i]} != ${res[i]['content']}`);
        match = false;
      }
    }

    this.test(match, "All replies are in order.");

  }


  async testCommentSimple() {
    let p = await this.createAComment('-KohAgezTF-yX6skgQVM', 'Simple 1').catch(e => this.error(e.message));
    this.test(p, "Comment created with: " + p);

  }


  createAComment(path, content, uid?, secret?): firebase.Promise<any> {
    let BA1: COMMENT = {
      route: 'createComment',
      path: path,
      uid: uid ? uid : this.userA.uid,
      secret: secret ? secret : this.userA.secret,
      content: content
    };
    return this.forum.createComment(BA1)
      .catch(e => this.error(e.message));

  }

  async testAdv() {
    console.log("\n ======================== testAvd() =============================");

    // this.backend({}, r => this.expect(r['code'], ERROR.requeset_is_empty, 'Calling with empty request must be failed'));
    this.backend({}, r => this.expect(this.base.errcode(r), ERROR.api_route_is_not_provided, 'route not provided'));
    this.backend({ route: '' }, r => this.expect(r['code'], ERROR.api_route_is_empty, 'empty route'));
    this.backend({ route: 'advertisement.create' }, r => this.expect(r['code'], ERROR.uid_is_empty, 'empty uid'));

    let body = {
      route: 'advertisement.create',     /// wrong route
      uid: this.userA.uid
    }
    this.backend(body, r => this.expect(r['code'], ERROR.secret_is_empty, 'empty secret'));


    body['secret'] = 'wrong-secret';        /// wrong secret

    /// Wrong route: calling create with backend environment.
    this.backend(body, r => this.expect(this.base.errcode(r), ERROR.wrong_route_class, "wrong route: " + r['code']));


    /// right route
    body.route = 'adv.create';
    this.backend(body, r => this.expect(this.base.errcode(r), ERROR.secret_does_not_match, "wrong secret: " + r['code']));




    /// calling create of interface directly.
    body['route'] = 'advertisement.create';
    body['subject'] = 'first adv!';
    let key = await this.adv.create(body)
      .then(key => { this.test(this.isPushKey(key), `Create success with Direct call of create advertisement interface: ${key}`); return key; })
      .catch(e => this.error("create failed with: " + e.message));

  }


  isPushKey(k) {
    if (!k) return false;
    if (typeof k !== 'string') return false;
    if (k.length > 21 || k.length < 19) return false;
    if (k.charAt(0) != '-') return false;
    return true;
  }


  // async testAdv_create() {
  //   let req = {
  //     body: {
  //       route: 'advertisement.create'
  //     }
  //   };
  //   let res = {
  //     send: (r) => {
  //       this.expect(r['code'], ERROR.uid_is_empty, 'Calling with empty uid must be failed');
  //     }
  //   }
  //   new BackendApi(db, req, res);
  // }



  /**
   * This method is going to test the real cloud functions with http.
   */
  testCloudFunctions() {

    console.log("\n ===================== testCloudFunctions ======================");

    let url = 'https://us-central1-sonub-e2b13.cloudfunctions.net/api';
    let form = {
    };
    request.post({ url: url, form: form }, (error, response, body) => {
      let res = JSON.parse(body);
      this.expect(this.base.errcode(res), ERROR.api_route_is_not_provided, "No route");
    });
    form['route'] = '';
    request.post({ url: url, form: form }, (error, response, body) => {
      let res = JSON.parse(body);
      this.expect(this.base.errcode(res), ERROR.api_route_is_empty, "Empty route");
    });
    form['route'] = 'forum.version';
    form['uid'] = '-wrong-uid';
    request.post({ url: url, form: form }, (error, response, body) => {
      let res = JSON.parse(body);
      this.expect(this.base.errcode(res), ERROR.secret_is_empty, "Empty secret");
    });

    form['secret'] = '-wrong-secret';
    request.post({ url: url, form: form }, (error, response, body) => {
      let res = JSON.parse(body);
      this.expect(this.base.errcode(res), ERROR.secret_does_not_match, "Empty route");
    });




    /// success. get version
    form['uid'] = this.userA.uid;
    form['secret'] = this.userA.secret;
    request.post({ url: url, form: form }, (error, response, body) => {
      let res = JSON.parse(body);
      this.expect(res.data, this.base.version(), "Version");
    });


    ///  error. no categories.
    form['route'] = 'forum.createPost';
    form['subject'] = 'A subject';
    form['content'] = 'A content';
    request.post({ url: url, form: form }, (error, response, body) => {
      // console.log( body );
      let res = JSON.parse(body);
      this.expect(this.base.errcode(res), ERROR.no_categories, "cloud functions: no categories");
    });


    ///  success
    form['categories'] = ['abc'];
    request.post({ url: url, form: form }, (error, response, body) => {
      // console.log( body );
      let res = JSON.parse(body);
      this.test(this.isPushKey(res.data), "cloud functions: forum.createPost: " + res.data);
      let pushKey = res.data;

      this.forum.getPostData(pushKey)
        .then((post: POST) => {
          let formEdit: POST_EDIT = {
            route: 'forum.editPost',
            key: pushKey,
            uid: this.userA.uid,
            secret: this.userA.secret,
            subject: 'subject B'
          };
          request.post({ url: url, form: formEdit }, (error, response, body) => {
            // console.log(body);
            let res = JSON.parse(body);
            this.expect(this.base.errcode(res), null, "cloud functions: no error on edit.");
            this.forum.getPostData(pushKey)
              .then((pe: POST) => {
                this.expect(pe.subject, formEdit.subject, "Post edited");
              })
              .catch(e => this.error(e.message));
          });
        })
        .catch(e => this.error(e.message));
    });


  }
}



new AppTest();
