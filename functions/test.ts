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
import { POST, CATEGORY, ALL_CATEGORIES } from './model/forum/forum.interface';
import { ERROR, isError } from './model/error/error';
import * as chalk from 'chalk';
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
    this.forum.setRoot( this.root );
    this.run();
  }

  async run() {

    this.log("TEST BEGIN at: " + (new Date).getMinutes() + ':' + (new Date).getSeconds());

    let re;

    await this.testIDFormat();
    await this.testMethods();
    await this.testCategory();
    await this.testPost();
    await this.testPostApi();

    setTimeout(() => {
      console.log(`Tests: ${this.successCount + this.errorCount}, successes: ${this.successCount}, errors: ${this.errorCount}`);
    }, 2000);

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

  async testMethods() {
    console.log("\n =========================== testMethods() =========================== ")

    // let re = this.forum.functionName({ function: '' });
    // this.expect(re, 'create', `functions name is empty`);

    // re = this.forum.functionName({ function: 'edit' });
    // this.expect(re, 'edit', `functions name is empty`);

    // re = this.forum.functionName({ function: 'delete' });
    // this.expect(re, 'delete', `functions name is empty`);


    // re = this.forum.functionName({ function: 'wrong' });
    // this.expect(re, 'wrong', `functions name is empty`);




    await this.forum.generateSecretKey(this.userA.uid)
      .then(key => this.success(`key: ${key} generated for ${this.userA.name}`))
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


  async testPost() {

    console.log("\n =========================== testPost() =========================== ");

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
    await this.forum.deletePost({ uid: '', key: '' }).catch(e => this.expect(e.message, ERROR.uid_is_empty, "deletePost() must have uid"));
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
      .then(() => { this.error("wrong function name must fail.")})
      .catch(e => this.expect(e.message, ERROR.unknown_function, 'Wrong function name test'));



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

    await this.forum.getPostData( post.key )
      .then(() => this.error('post was not deleted'))
      .catch( e => this.expect( e.message, ERROR.post_not_found_by_that_key, 'post poroperly deleted'))



    // @todo
    // post create with key

    // post CRUD by admin.

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
    // console.log("a:", a, "b:", b);
    if (a == b) this.success(m + ' ===> a: ' + a + ', b: ' + b);
    else this.error(m + ', a: ' + a + ', b: ' + b);
  }


}


new AppTest();
