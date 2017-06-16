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
var firebase = require("firebase/app");
var error_1 = require("../error/error");
var forum_interface_1 = require("./forum.interface");
var Forum = (function () {
    function Forum(root) {
        this.root = root;
        this.debugPath = '';
        this.lastErrorMessage = '';
    }
    Object.defineProperty(Forum.prototype, "getLastErrorMessage", {
        get: function () {
            var re = this.lastErrorMessage;
            this.lastErrorMessage = '';
            return re;
        },
        enumerable: true,
        configurable: true
    });
    Forum.prototype.createCategory = function (data) {
        var _this = this;
        if (this.checkKey(data.id))
            return firebase.Promise.reject(new Error(error_1.ERROR.malformed_key));
        return this.categoryExists(data.id).then(function (re) {
            throw new Error(error_1.ERROR.category_exists);
        })
            .catch(function (e) {
            if (e.message == error_1.ERROR.category_not_exist) {
                return _this.setCategory(data);
            }
            if (e.message == error_1.ERROR.category_exists) {
                _this.setLastErrorMessage(data.id + " category already exists");
            }
            throw e;
        });
    };
    Forum.prototype.checkKey = function (key) {
        if (key === void 0 || !key)
            return true;
        if (key.indexOf('#') != -1)
            return true;
        if (key.indexOf('/') != -1)
            return true;
        if (key.indexOf('.') != -1)
            return true;
        if (key.indexOf('[') != -1)
            return true;
        if (key.indexOf(']') != -1)
            return true;
        return false;
    };
    Forum.prototype.editCategory = function (data) {
        var _this = this;
        if (this.isEmpty(data.id))
            return this.error(error_1.ERROR.category_id_empty);
        if (this.checkKey(data.id))
            return firebase.Promise.reject(new Error(error_1.ERROR.malformed_key));
        return this.categoryExists(data.id).then(function (re) {
            return _this.setCategory(data);
        });
    };
    Forum.prototype.setCategory = function (data) {
        if (this.isEmpty(data.id))
            return this.error(error_1.ERROR.category_id_empty);
        data = this.undefinedToNull(data);
        return this.category(data.id).set(data).then(function () { return data.id; });
    };
    Forum.prototype.deleteCategory = function (id) {
        if (this.isEmpty(id))
            return this.error(error_1.ERROR.category_id_empty);
        return this.category(id).set(null);
    };
    Forum.prototype.getCategories = function () {
        var categories = [];
        return this.category().once('value').then(function (snapshot) {
            var val = snapshot.val();
            for (var _i = 0, _a = Object.keys(val); _i < _a.length; _i++) {
                var k = _a[_i];
                var v = val[k];
                categories.push(v);
            }
            return categories;
        });
    };
    Forum.prototype.getCategory = function (category) {
        if (this.isEmpty(category))
            return this.error(error_1.ERROR.category_id_empty);
        return this.category(category).once('value').then(function (s) { return s.val(); });
    };
    Forum.prototype.isEmpty = function (category) {
        return category === void 0 || !category;
    };
    Forum.prototype.error = function (e) {
        return firebase.Promise.reject(new Error(e));
    };
    Forum.prototype.isEmptyCategory = function (post) {
        if (post['categories'] === void 0 || post.categories.length === void 0 || post.categories.length == 0)
            return true;
        else
            return false;
    };
    Forum.prototype.checkPost = function (post) {
        if (post === void 0)
            return error_1.ERROR.post_data_is_empty;
        if (this.isEmptyCategory(post))
            return error_1.ERROR.no_categories;
        return null;
    };
    Forum.prototype.createPost = function (post) {
        return __awaiter(this, void 0, firebase.Promise, function () {
            var ref;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.checkPost(post))
                            return [2 /*return*/, this.error(this.checkPost(post))];
                        return [4 /*yield*/, this.categoriesExist(post.categories)];
                    case 1:
                        _a.sent();
                        ref = this.postData().push();
                        return [2 /*return*/, this.setPostData(ref, post)];
                }
            });
        });
    };
    Forum.prototype.editPost = function (post) {
        return __awaiter(this, void 0, firebase.Promise, function () {
            var p, ref;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.checkPost(post))
                            return [2 /*return*/, this.error(this.checkPost(post))];
                        return [4 /*yield*/, this.categoriesExist(post.categories)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getPostData(post.key)];
                    case 2:
                        p = _a.sent();
                        ref = this.postData(post.key);
                        return [2 /*return*/, this.setPostData(ref, post)];
                }
            });
        });
    };
    Forum.prototype.deletePost = function (post) {
        return this.error(error_1.ERROR.unknown);
    };
    Forum.prototype.setPostData = function (ref, post) {
        var _this = this;
        post.key = ref.key;
        post.stamp = Math.round((new Date()).getTime() / 1000);
        return ref.set(post)
            .then(function () { return _this.setCategoryPostRelation(post.key, post.categories); })
            .then(function () { return post.key; });
    };
    Forum.prototype.getPostData = function (key) {
        if (this.isEmpty(key))
            return this.error(error_1.ERROR.post_key_empty);
        return this.postData(key).once('value').then(function (s) {
            var post = s.val();
            if (post)
                return post;
            else
                throw new Error(error_1.ERROR.post_not_found_by_that_key);
        });
    };
    Forum.prototype.categoriesExist = function (categories) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, categories_1, category;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, categories_1 = categories;
                        _a.label = 1;
                    case 1:
                        if (!(_i < categories_1.length)) return [3 /*break*/, 4];
                        category = categories_1[_i];
                        return [4 /*yield*/, this.categoryExists(category)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, true];
                }
            });
        });
    };
    Forum.prototype.categoryExists = function (category) {
        var _this = this;
        return this.category(category).once('value')
            .then(function (s) {
            if (s.val())
                return true;
            else {
                _this.setLastErrorMessage("Category " + category + " does not exist.");
                return firebase.Promise.reject(new Error(error_1.ERROR.category_not_exist));
            }
        });
    };
    Forum.prototype.setCategoryPostRelation = function (key, categories) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, categories_2, category;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (categories === void 0 || categories.length === void 0 || categories.length == 0)
                            return [2 /*return*/];
                        _i = 0, categories_2 = categories;
                        _a.label = 1;
                    case 1:
                        if (!(_i < categories_2.length)) return [3 /*break*/, 4];
                        category = categories_2[_i];
                        console.log("writing for category : " + category);
                        return [4 /*yield*/, this.categoryPostRelation.child(category).child(key).set(true)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, this.categoryPostRelation.child(forum_interface_1.ALL_CATEGORIES).child(key).set(true)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Forum.prototype.page = function (o) {
        var $ref = this.postData().orderByKey().limitToLast(o.size);
        return $ref
            .once('value')
            .then(function (s) {
            var objects = s.val();
            var posts = [];
            for (var _i = 0, _a = Object.keys(objects).reverse(); _i < _a.length; _i++) {
                var k = _a[_i];
                posts.push(objects[k]);
            }
            return posts;
        });
    };
    Forum.prototype.undefinedToNull = function (obj) {
        obj = JSON.parse(JSON.stringify(obj, function (k, v) {
            if (v === undefined)
                return null;
            else
                return v;
        }));
        return obj;
    };
    Forum.prototype.category = function (name) {
        if (this.isEmpty(name))
            return this.root.ref.child(this.categoryPath);
        else
            return this.root.ref.child(this.categoryPath).child(name);
    };
    Object.defineProperty(Forum.prototype, "categoryPath", {
        get: function () {
            return this.path(forum_interface_1.CATEGORY_PATH);
        },
        enumerable: true,
        configurable: true
    });
    Forum.prototype.postData = function (key) {
        if (this.isEmpty(key))
            return this.root.ref.child(this.postDataPath);
        else
            return this.root.ref.child(this.postDataPath).child(key);
    };
    Object.defineProperty(Forum.prototype, "postDataPath", {
        get: function () {
            return this.path(forum_interface_1.POST_DATA_PATH);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Forum.prototype, "categoryPostRelation", {
        get: function () {
            return this.root.ref.child(this.categoryPostRelationPath);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Forum.prototype, "categoryPostRelationPath", {
        get: function () {
            return this.path(forum_interface_1.CATEGORY_POST_RELATION_PATH);
        },
        enumerable: true,
        configurable: true
    });
    Forum.prototype.path = function (p) {
        p = this.debugPath + p;
        return p;
    };
    Forum.prototype.postApi = function (params) {
        if (params === void 0)
            return this.error(error_1.ERROR.requeset_is_empty);
        if (params.function === void 0)
            return this.error(error_1.ERROR.function_is_not_provided);
        if (params.data === void 0)
            return this.error(error_1.ERROR.requeset_data_is_empty);
        if (params.data.uid === void 0)
            return this.error(error_1.ERROR.uid_is_empty);
        if (this.checkKey(params.data.uid))
            return this.error(error_1.ERROR.malformed_key);
        switch (params.function) {
            case 'create': return this.createPost(params.data);
            case 'edit': return this.editPost(params.data);
            case 'delete': return this.deletePost(params.data);
            default: return this.error(error_1.ERROR.unknown_function);
        }
    };
    Forum.prototype.setLastErrorMessage = function (m) {
        this.lastErrorMessage = m;
    };
    return Forum;
}());
exports.Forum = Forum;
//# sourceMappingURL=forum.js.map