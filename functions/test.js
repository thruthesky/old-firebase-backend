"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var admin = require("firebase-admin");
var test_service_key_1 = require("./etc/test-service-key");
var app = admin.initializeApp({
    credential: admin.credential.cert(test_service_key_1.default),
    databaseURL: "https://test-ec3e3.firebaseio.com"
});
var db = app.database();
var forum_1 = require("./model/forum/forum");
var forum_interface_1 = require("./model/forum/forum.interface");
var error_1 = require("./model/error/error");
var chalk = require("chalk");
;
function datetime() {
    var d = new Date();
    return d.getMonth() + '-' + d.getDate() + ':' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}
var AppTest = (function () {
    function AppTest() {
        this.errorCount = 0;
        this.unexpectedCount = 0;
        this.successCount = 0;
        this.root = db.ref('/');
        this.forum = new forum_1.Forum(this.root);
        this.run();
    }
    AppTest.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var re;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log("TEST BEGIN at : " + (new Date).getMinutes() + ':' + (new Date).getSeconds());
                        return [4 /*yield*/, this.testCategoryIDFormat()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.testCategory()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.testPost()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.testPostApi()];
                    case 4:
                        _a.sent();
                        setTimeout(function () {
                            console.log("Tests: " + (_this.successCount + _this.errorCount) + ", successes: " + _this.successCount + ", errors: " + _this.errorCount);
                        }, 2000);
                        return [2 /*return*/];
                }
            });
        });
    };
    AppTest.prototype.testCategoryIDFormat = function () {
        return __awaiter(this, void 0, void 0, function () {
            var re;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.forum.createCategory({ id: 'abc#def', name: 'is error' }).catch(function (e) { return e.message; })];
                    case 1:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.malformed_key, "category id(push key) with # is malformed.");
                        return [4 /*yield*/, this.forum.createCategory({ id: 'abc.def', name: 'is error' }).catch(function (e) { return e.message; })];
                    case 2:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.malformed_key, "category id(push key) with . is malformed.");
                        return [4 /*yield*/, this.forum.createCategory({ id: 'abc/def', name: 'is error' }).catch(function (e) { return e.message; })];
                    case 3:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.malformed_key, "category id(push key) with [ is malformed.");
                        return [4 /*yield*/, this.forum.createCategory({ id: 'abc[def', name: 'is error' }).catch(function (e) { return e.message; })];
                    case 4:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.malformed_key, "category id(push key) with [ is malformed.");
                        return [4 /*yield*/, this.forum.createCategory({ id: 'abc]def', name: 'is error' }).catch(function (e) { return e.message; })];
                    case 5:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.malformed_key, "category id(push key) with [ is malformed.");
                        return [4 /*yield*/, this.forum.createCategory({ id: '', name: 'Books' })
                                .then(function (x) { return true; })
                                .catch(function (e) { return e.message; })];
                    case 6:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.malformed_key, "category with no id create test");
                        return [2 /*return*/];
                }
            });
        });
    };
    AppTest.prototype.testCategory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var re, category, abc_category, categories;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n =========================== testCategory() =========================== ");
                        return [4 /*yield*/, this.forum.createCategory({ id: '' })
                                .then(function (x) { return _this.error('Creating a category with empty data must be failed.'); })
                                .catch(function (e) {
                                if (e.message == error_1.ERROR.malformed_key)
                                    _this.success("Creating with empty data failed properly failed");
                                else
                                    _this.error("Something happened on creating category with empty data.");
                            })];
                    case 1:
                        _a.sent();
                        category = { id: 'category' + datetime(), name: 'Books' };
                        return [4 /*yield*/, this.forum.createCategory(category)
                                .catch(function (e) { return e.message; })];
                    case 2:
                        re = _a.sent();
                        this.expect(re, category.id, "Category create ok with: " + JSON.stringify(category) + ' => ' + this.forum.lastErrorMessage);
                        return [4 /*yield*/, this.forum.createCategory(category)
                                .then(function (x) { return true; })
                                .catch(function (e) { return e.message; })];
                    case 3:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.category_exists, "Category already exists with : " + JSON.stringify(category));
                        return [4 /*yield*/, this.forum.categoryExists(category.id).catch(function (e) { return e.message; })];
                    case 4:
                        re = _a.sent();
                        this.expect(re, true, "Category exists");
                        return [4 /*yield*/, this.forum.categoryExists('abc').catch(function (e) { return e.message; })];
                    case 5:
                        re = _a.sent();
                        if (!(re === true)) return [3 /*break*/, 7];
                        this.log("abc category exists. goint to delete");
                        return [4 /*yield*/, this.forum.deleteCategory('abc').then(function (x) { return true; }).catch(function (e) { return e.message; })];
                    case 6:
                        re = _a.sent();
                        this.expect(re, true, "Category 'abc' deleted.");
                        _a.label = 7;
                    case 7:
                        abc_category = { id: 'abc', name: 'ABC English', description: 'Hello English' };
                        return [4 /*yield*/, this.forum.createCategory(abc_category)
                                .catch(function (e) { return e.message; })];
                    case 8:
                        re = _a.sent();
                        this.expect(re, abc_category.id, "Category created with : " + JSON.stringify(category));
                        return [4 /*yield*/, this.forum.deleteCategory('flower')];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.forum.createCategory({ id: 'flower', name: 'Flower category' })];
                    case 10:
                        _a.sent();
                        categories = ['abc', category.id];
                        return [4 /*yield*/, this.forum.categoriesExist(categories)
                                .catch(function (e) { return e.message; })];
                    case 11:
                        re = _a.sent();
                        this.expect(re, true, "Multiple category existence check. All categories exists: " + categories.toString());
                        categories = ['abc', 'no-exist-category', category.id];
                        return [4 /*yield*/, this.forum.categoriesExist(categories)
                                .catch(function (e) { return e.message; })];
                    case 12:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.category_not_exist, "Multiple category extence check. Expect error. A category should not be exists. : " + categories.toString());
                        return [4 /*yield*/, this.forum.getCategory('')
                                .then(function (x) { return _this.error('getCategory() with empty category id must be failed.'); })
                                .catch(function (e) {
                                if (e.message = error_1.ERROR.category_id_empty)
                                    _this.success("getCategory() with empty id properly failed");
                                else
                                    _this.error("getCategory() with empty category id must be failed with category id empty error.");
                            })];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, this.forum.getCategory(abc_category.id)
                                .then(function (x) { _this.success("getCategory() success with: " + JSON.stringify(x)); return x; })
                                .catch(function (e) { return _this.error("getCategory failed with: " + e); })];
                    case 14:
                        re = _a.sent();
                        this.expect(re.id, abc_category.id, "Category id must be " + abc_category.id);
                        this.expect(re.name, abc_category.name, "Category name must be " + abc_category.name);
                        this.expect(re.description, abc_category.description, "Category description must be " + abc_category.description);
                        return [4 /*yield*/, this.forum.editCategory({ id: '' })
                                .then(function (x) { return _this.error('Category edit with empty id must be failed'); })
                                .catch(function (e) {
                                if (e.message == error_1.ERROR.category_id_empty)
                                    _this.success("Category with empty id failed properly.");
                                else
                                    _this.error("Something wrong with category edit. It should be failed with category id empty error but: " + e.message);
                            })];
                    case 15:
                        _a.sent();
                        return [4 /*yield*/, this.forum.editCategory({ id: 'Oo-wrong-category' })
                                .then(function (x) { return _this.error('Category edit with wrong id must be failed'); })
                                .catch(function (e) {
                                if (e.message == error_1.ERROR.category_not_exist)
                                    _this.success("Category with wrong id failed properly.");
                                else
                                    _this.error("Something wrong with category edit. It should be failed with category id not exists error but: " + e.message);
                            })];
                    case 16:
                        _a.sent();
                        abc_category.description = "description edited.";
                        return [4 /*yield*/, this.forum.editCategory(abc_category)
                                .then(function (x) { return _this.success('Category edit success'); })
                                .catch(function (e) {
                                _this.error("Something wrong with category edit. error code : " + e.message);
                            })];
                    case 17:
                        _a.sent();
                        return [4 /*yield*/, this.forum.getCategory(abc_category.id)
                                .then(function (x) { _this.success("getCategory() success with: " + JSON.stringify(x)); return x; })
                                .catch(function (e) { return _this.error("getCategory failed with: " + e); })];
                    case 18:
                        re = _a.sent();
                        this.expect(re['description'], abc_category.description, "category data properly edited");
                        return [4 /*yield*/, this.forum.getCategories()
                                .then(function (categories) {
                                if (Array.isArray(categories)) {
                                    if (categories.length > 1) {
                                        if (categories[0]['id'])
                                            return _this.success("getCategoreis() success. First category id: " + categories[0]['id']);
                                    }
                                }
                                _this.error("getCategories() has no data");
                            })
                                .catch(function (e) {
                                _this.error("getCategories() failed with: " + e.message);
                            })];
                    case 19:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AppTest.prototype.testPost = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var re, post, key, key_flower, key_book;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n =========================== testPost() =========================== ");
                        post = {};
                        return [4 /*yield*/, this.forum.createPost(post)
                                .catch(function (e) { return e.message; })];
                    case 1:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.no_categories, "Post Create: No categories" + this.forum.lastErrorMessage);
                        post.categories = ['qna', 'no-category', 'movie'];
                        return [4 /*yield*/, this.forum.createPost(post)
                                .catch(function (e) { return e.message; })];
                    case 2:
                        re = _a.sent();
                        this.expect(re, error_1.ERROR.category_not_exist, "Post create : " + this.forum.lastErrorMessage);
                        post.key = '-key-13245abc';
                        return [4 /*yield*/, this.forum.createPost(post).catch(function (e) { return _this.expect(e.message, error_1.ERROR.post_key_exists_on_create, 'Post create with key properly failed.'); })];
                    case 3:
                        _a.sent();
                        post.key = '';
                        post.categories = ['abc'];
                        post.subject = "Opo";
                        return [4 /*yield*/, this.forum.createPost(post)];
                    case 4:
                        re = _a.sent();
                        this.expect(re['message'], void 0, "Post created with key: " + re);
                        return [4 /*yield*/, this.forum.getPostData(re)
                                .then(function (post) {
                                if (post.subject == 'Opo')
                                    _this.success("getPostData() success with: " + post.subject);
                                else
                                    _this.error("failed to getPost() : subject is wrong");
                            })
                                .catch(function (e) { return _this.error(e); })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.forum.getPostData('-12345abc----')
                                .then(function (p) { return _this.error("Wrong post key to get a post must be failed. result: " + JSON.stringify(p)); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.post_not_found_by_that_key, "post not found with wrong key properly failed"); })];
                    case 6:
                        _a.sent();
                        post = { categories: ['abc'], subject: "C: " + this.testSubject() };
                        return [4 /*yield*/, this.forum.createPost(post)];
                    case 7:
                        key = _a.sent();
                        this.forum.getPostData(key)
                            .then(function (p) {
                            _this.expect(p.categories.length, 1, "getPostData() success with: " + JSON.stringify(p));
                            _this.expect(p.categories[0], 'abc', "category match");
                            _this.forum.categoryPostRelation.child(p.categories[0]).child(p.key).once('value')
                                .then(function (s) { return _this.expect(s.val(), true, "Post exists under " + p.categories[0] + " category !!"); });
                        })
                            .catch(function (e) { return _this.error("getPostData() failed with key: " + key); });
                        post.key = '';
                        return [4 /*yield*/, this.forum.editPost(post).then(function (key) { return _this.error("Post edit with no key must be failed"); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.post_key_empty, "Post edit with no key failed."); })];
                    case 8:
                        _a.sent();
                        post.key = key + 'wrong';
                        return [4 /*yield*/, this.forum.editPost(post).then(function () { return _this.error("Post edit with wrong key must be failed"); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.post_not_found_by_that_key, "Post edit with wrong key failed."); })];
                    case 9:
                        _a.sent();
                        post.key = key;
                        post.categories = ['abc', 'flower', 'def'];
                        return [4 /*yield*/, this.forum.editPost(post)
                                .then(function (key) {
                                _this.error("Post edit with wrong categroy - must be failed. post data:" + JSON.stringify(post));
                            })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.category_not_exist, "Post edit with wrong category failed."); })];
                    case 10:
                        _a.sent();
                        post.categories = ['flower'];
                        return [4 /*yield*/, this.forum.editPost(post)
                                .then(function (key) {
                                _this.success("Post edit with different categroy success.");
                                _this.forum.getPostData(key).then(function (p) {
                                    _this.forum.categoryPostRelation.child('flower').child(p.key).once('value')
                                        .then(function (s) { return _this.expect(s.val(), true, "Post exists under flower category !!"); });
                                    _this.forum.categoryPostRelation.child('abc').child(p.key).once('value')
                                        .then(function (s) { return _this.expect(s.val(), null, "Post does not exist under abc category !!"); });
                                });
                            })
                                .catch(function (e) { return _this.error("post edit with different category must success."); })];
                    case 11:
                        _a.sent();
                        post.categories = ['abc', 'flower'];
                        return [4 /*yield*/, this.forum.editPost(post)
                                .then(function (key) {
                                _this.success("Post edit with different categroy success.");
                                _this.forum.getPostData(key).then(function (p) {
                                    _this.forum.categoryPostRelation.child('flower').child(p.key).once('value')
                                        .then(function (s) { return _this.expect(s.val(), true, "Post exists under flower category !!"); });
                                    _this.forum.categoryPostRelation.child('abc').child(p.key).once('value')
                                        .then(function (s) { return _this.expect(s.val(), true, "Post exists under abc category !!"); });
                                });
                            })
                                .catch(function (e) { return _this.error("post edit with different category must success."); })];
                    case 12:
                        _a.sent();
                        post.subject = "edited !!";
                        post.content = "content is edited";
                        return [4 /*yield*/, this.forum.editPost(post).then(function (key) {
                                _this.forum.getPostData(key).then(function (p) {
                                    _this.expect(p.subject, post.subject, "Subject edited");
                                    _this.expect(p.content, post.content, "Content edited");
                                });
                            })];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, this.forum.createPost({ categories: ['flower'], subject: 'I leave you a flower', uid: '-key-12345a' })];
                    case 14:
                        key_flower = _a.sent();
                        return [4 /*yield*/, this.forum.createPost({ categories: ['abc'], subject: 'I leave you a book', uid: this.testUid() })];
                    case 15:
                        key_book = _a.sent();
                        return [4 /*yield*/, this.forum.category('abc').child(key_book).once('value').then(function (x) { return _this.success(key_book + " exists under abc category"); }).catch(function (e) { return _this.error(e.message); })];
                    case 16:
                        _a.sent();
                        return [4 /*yield*/, this.forum.category(forum_interface_1.ALL_CATEGORIES).child(key_book).once('value').then(function (x) { return _this.success(key_book + " exists under all category"); }).catch(function (e) { return _this.error(e.message); })];
                    case 17:
                        _a.sent();
                        return [4 /*yield*/, this.forum.deletePost('', '').catch(function (e) { return _this.expect(e.message, error_1.ERROR.uid_is_empty, "deletePost() must have uid"); })];
                    case 18:
                        _a.sent();
                        return [4 /*yield*/, this.forum.deletePost('a', '').catch(function (e) { return _this.expect(e.message, error_1.ERROR.post_key_empty, "deletePost() must have key"); })];
                    case 19:
                        _a.sent();
                        return [4 /*yield*/, this.forum.deletePost('-key-ddd', key_book)
                                .then(function (key) { return _this.error("deletePost() with worng uid must be failed"); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.permission_denied, "deletePost() with wrong uid properly failed with permission denied."); })];
                    case 20:
                        _a.sent();
                        return [4 /*yield*/, this.forum.deletePost(this.testUid(), key_book)
                                .then(function (key) { return _this.success("deletePost( " + key + " ) was sucess with " + key_book); })
                                .catch(function (e) { return _this.error("deletePost() failed: " + e.message); })];
                    case 21:
                        _a.sent();
                        return [4 /*yield*/, this.forum.category('abc').child(key_book).once('value').then(function (s) { return _this.expect(s.val(), null, key_book + " does not exist under abc category"); }).catch(function (e) { return _this.error(e.message); })];
                    case 22:
                        _a.sent();
                        return [4 /*yield*/, this.forum.category(forum_interface_1.ALL_CATEGORIES).child(key_book).once('value').then(function (s) { return _this.expect(s.val(), null, key_book + " does not exist under all category"); }).catch(function (e) { return _this.error(e.message); })];
                    case 23:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AppTest.prototype.testPostApi = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var req, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n =========================== testPostApi() =========================== ");
                        return [4 /*yield*/, this.forum.postApi({}).catch(function (e) { return _this.expect(e.message, error_1.ERROR.function_is_not_provided, 'function not providing test.'); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.forum.postApi({ function: 'no-function-name' })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.requeset_data_is_empty, 'function is give but data is not given.'); })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.forum.postApi({ function: 'no-function-name', data: { uid: '-12345a' } })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.unknown_function, 'Wrong function name test'); })];
                    case 3:
                        _a.sent();
                        req = {
                            function: 'create',
                            data: {
                                subject: 'post create test by api',
                                content: 'This is content',
                                uid: this.testUid()
                            }
                        };
                        return [4 /*yield*/, this.forum.postApi(req)
                                .then(function () { return _this.error("Calling postApi with no category must be failed."); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.no_categories, 'postApi() for creating a post with no category properly failed'); })];
                    case 4:
                        _a.sent();
                        req.data['categories'] = ['wrong-category'];
                        return [4 /*yield*/, this.forum.postApi(req)
                                .then(function () { return _this.error("Calling postApi with wrong category must be failed."); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.category_not_exist, 'postApi() for creating a post with wrong category properly failed'); })];
                    case 5:
                        _a.sent();
                        req.data['categories'] = ['abc', 'flower'];
                        return [4 /*yield*/, this.forum.postApi(req)
                                .then(function (key) { _this.success("Post create with postApi(function:create) success . key: " + key); return key; })
                                .catch(function (e) { return _this.error("A post should be created."); })];
                    case 6:
                        key = _a.sent();
                        console.log("KEY ===> ", key);
                        req.function = 'edit';
                        req.data.key = key;
                        req.data.categories = [];
                        req.data.subject = "Subject updated...!";
                        req.data.content = "Content updated...!";
                        return [4 /*yield*/, this.forum.postApi(req)
                                .then(function () { return _this.error("Calling postApi with empty category must be failed."); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.no_categories, 'postApi() for editing a post with no category properly failed'); })];
                    case 7:
                        _a.sent();
                        req.data.categories = ['abc', 'def', 'flower'];
                        return [4 /*yield*/, this.forum.postApi(req)
                                .then(function () { return _this.error("Calling postApi with empty category must be failed."); })
                                .catch(function (e) { return _this.expect(e.message, error_1.ERROR.category_not_exist, 'postApi() for editing a post with wrong category properly failed'); })];
                    case 8:
                        _a.sent();
                        req.data.categories = ['abc'];
                        return [4 /*yield*/, this.forum.postApi(req)
                                .then(function (key) {
                                _this.success("Post edit success with: " + key);
                                _this.forum.getPostData(key).then(function (p) {
                                    _this.expect(p.key, req.data.key, "postApi(function:edit) key match");
                                    _this.expect(p.subject, req.data.subject, "Subject edit with postApi(function:eidt) success.");
                                    _this.expect(p.content, req.data.content, "Content edit with postApi(function:eidt) success.");
                                    _this.forum.categoryPostRelation.child('flower').child(p.key).once('value')
                                        .then(function (s) { return _this.expect(s.val(), null, "Post does not exist under flower category !!"); });
                                    _this.forum.categoryPostRelation.child('abc').child(p.key).once('value')
                                        .then(function (s) { return _this.expect(s.val(), true, "Post exists under abc category !!"); });
                                });
                            })
                                .catch(function (e) { return _this.error("Edit should be success."); })];
                    case 9:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AppTest.prototype.testPostData = function () {
        return {
            uid: this.testUid(),
            subject: this.testSubject(),
            content: this.testContent(),
            categories: this.testCategories()
        };
    };
    AppTest.prototype.testSubject = function () {
        var d = new Date();
        return 'SUBJECT: ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    };
    AppTest.prototype.testContent = function () {
        var d = new Date();
        return 'TEST CONTENT' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    };
    AppTest.prototype.testUid = function () {
        return '0PNzxFcsyiQ4LqOXPLtYbgFtgTw1';
    };
    AppTest.prototype.testCategories = function () {
        return ['movie', 'no-exists'];
    };
    AppTest.prototype.testCreateCategory = function () {
        return [
            { id: 'movie', name: 'Movie', description: "Let's go to Movie!", owner: 'thruthesky' },
            { id: 'music', name: 'Music', description: "Play music", owner: 'eunsu' },
            { id: 'play', name: 'Play', description: "Play with me", owner: 'thruthesky' },
            { id: 'game', name: 'Game', description: "Lineage game!", owner: 'lineage' }
        ];
    };
    AppTest.prototype.success = function (m) {
        this.successCount++;
        console.log("----> SUCCESS (" + this.successCount + ") : ", m);
    };
    AppTest.prototype.error = function (m) {
        this.errorCount++;
        var e = chalk.white.bgRed.bold(' ERROR ');
        console.log("----> " + e + " (" + this.errorCount + ") : ", m);
    };
    AppTest.prototype.unexpected = function (m) {
        this.unexpectedCount++;
        console.log("----> UNEXPECTED (" + this.errorCount + ") : ", m);
    };
    AppTest.prototype.log = function (m) {
        console.log("----> LOG : ", m);
    };
    AppTest.prototype.expect = function (a, b, m) {
        if (a == b)
            this.success(m + ' ===> a: ' + a + ', b: ' + b);
        else
            this.error(m + ', a: ' + a + ', b: ' + b);
    };
    return AppTest;
}());
new AppTest();
//# sourceMappingURL=test.js.map