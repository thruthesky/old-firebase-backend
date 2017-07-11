# Firebase Backend

Firebase Backend system.


# TODO

Refer issues



# How to work/code

* If you are coding firebase-backend under another project,
    * You should open 'firebase-backend' folder in a new 'VSCode' as a new porject.
    * And work in that folder independently from the parent project.


# Terms

* `3rd party social login` is the social logins that are not supported by Firebase Authentication. like kakao, naver.


# Installation

## Installing node modules

````
$ npm install --verbose
````


## Change Project ID

in .firebaserc

````
{
  "projects": {
    "default": project-id-xxxxx"
  }
}
````

## Update etc/service-key.ts

* get service account key from google firebase conole and save it in etc/service-key.json



## Setting Backend URL

* deploy postApi and get the url and set it on api.setBackendUrl()



````
  constructor( api: ApiService ) {
    api.setBackendUrl('https://xxxxxxxxxxxxxxxxxx/postApi');
  }
````


## node_modules

* chalk is for testing in terminal for nice look.
* tyepscript is for compliing
* firebase is for forum model.
    * firebase SDK is needed only for typing in cloud functions to boost the compaitibility of forum model.
    * But for Angular, firebase SDK probably needed in forum model.



# Coding Guideline for Developers

## Debug Environment

* Since we are not listing database onWrite, we do not need a fake database ref path like "/a/forum/category"


## No registration

* Since we are planning only with social login, we don't do user authorization code.
* If there is a case for anonymous user could write, then just let them write but not editable and deletable.


## Interface

* POST.function is 'create' by default.
* When you are going to create/edit a post, you don't have to give 'function' property.
* It is determined by 'key' of the POST data. If 'key' does not exist, it's 'create'. If it has 'key' then, it is 'edit'.
* POST.function can be 'create', 'edit', 'delete'.



## Base class.

Since the backend is running on `Fire Functions` ( Firebase Cloud Functions ),
the database reference is different from front end.

So, the App needs to plug `database connection` to the Base class.



## User module

User module is only used in client.

It uses angularfire2 that is not even installed on cloud function. so do not care about it on cloud funtions.


## Post module

* Only for create/edit/delete of post & comment will be done here.

* CRUD of category will be done by firebase SDK in angular.

* Other works like 'like', 'dislike', 'report as spam', etc will be done in Angular with firebase SDK.



## Firebase Cloud Functions as Backend

* There is a clear reason why some tasks must be in backend. NOT in front end of Angular.
  * Bad users can mess up the databases.
  * POINT System ( or other Level Earning System ) must keep its rule secret.
  
* Make the `fire Functions` as minimal as it can be because it is extremely difficult to work with `functions`. There is no good way of debugging.

* Put ONLY critical code inside `fire functions` like post creating, editing, deleting.
  Mostly user actions.
  * If you don't put post create in `fire functions`, bad user may put garbage data on `/forum/category-post-relation` and that will ruin the system.
  * It is okay to create garbase post using `fire functions` because at least, `/forum/category-post-relation` and `/forum/post/data` will be matched each other.





# Trouble Shooting

## Angular compilation

while compiling angular code, and if you see any error messages by compiling functions/api.ts, and other script that are not actually needed by angular, just exclude them.




# User login

* All user must log in into Firebase.


`UserSerivce.isLogged` is the only property that determins whether the user logged or not and it checks Firebase log-in.
So, all `3rd party social login` must create an Email/Password account in Firebase.


* Secure key and Pofile data will be loaded
  * every time user logs in
  * or when a user refreshes the site.






## 3rd Party Login Security - Kakao, Naver, and Others.



When a user logs in with `3rd party social` like Naver/Kakao, the user needs to register to Firebase using email/password authentication.

App will user the `id` and t `email` form the `3rd Party Social`.

`id` alone is very easy to guess and `email` alone is also very easy to guess.

BUT the combination of `id` and `email` is almost impossible to guess unless you know one of them.


So, it is very secure to use `3rd Party Social id` as the Firebase user id(email) and `3rd Party Social email` as the user's password.

* Remember `3rd party social id` is used as `login email` and `3rd party soical email` is used as `login password`.
* `3rd party social id` and `3rd party social email` must not be shown to public or others.
  If you do not show `3rd party social id` and `3rd party social email` to public, the login will be very much safe.




## loginUser

It holds `login user's firebase User object`. Not profile data.



* `UserService.loginUser` is set when
  * User registers with Email/Password.
  * Email/Password login with `UserService.login()` is invoked
  * All social login was made.



* `loginUser` may different from `auth.currentUser`
  * If a user;
      * registers with `createUserWithEmailAndPassword()`,
      * or logs in with `UserService.login()` as Email/Password login,
      * or logs in with Social Service,
        * the user object returned from the login method will be set to `loginUser`.
        * This is not `currentUser`.
  * and later when `onAuthStateChanged()` is called, the returned current user object will be set to `loginUser`. 
  * So, `loginUser` is set twice and the first
  this may be different from `auth.currentUser`




## Profile

User's profile data is saved on `/user/profile` and this node will be updated( NOT reset) when the user updates his profile on profile page.

Every time a user has auth with `onAuthStateChanged()`, the user's profile data will be updated by the user's social profile data.
( Profile data like phone number will not be overwritten )

After login/register, it takes some time for the profile to be loaded and if you are going to use it in template, it may display nothing until the profile is completely loaded.

  * This mean, even if `UserService.isLogin` is true, profile data may not be loaded yet.

  * For instance, when a user freshes a page in profile page,
    * while `.isLogin` is true, but `.profile` will still be loading.
    * App can ask user to visit main page and visit the profile page agin.
````
if ( ! this.app.user.profile.email ) this.app.go('/', "You are visiting this page with wrong route. Go main page and visit here again.");
````

* `UserService.profile` is set to empty object '{}' when the user is not logged in(and the profile is not loadded) which means that, refering {{ app.user.profile.name }} will not produce error.



### UserService.getProfile()

* It gets user profile data from `/user/profile/` based on the `loginUser.uid`. So, if the user has not logged in, there might an error. So, 'loginUser' must be set before this method.
* And sets the user profile data to `UserService.profile` property.
* And re-render page, ngZone.run(), to refresh/update the user profile information into view.

* When a user logs in, `onAuthStateChanged()` will be called soon.
  * When `getProfile()` will be called immediately in `onAuthStateChanged()`
  * So, you don't have to call `getProfile()` by userself unless user changes his profile information.

component class) To get/load user profile data from database.

````
user.getProfile()
  .then( profile => {} )
  .catch( e => {
    if ( isError(e.message, ERROR.user_not_logged_in ) )this.error = "You are not logged in";
    else this.error = e.message;
  });
````

template
````
<div *ngIf=" user.isLogin && app.user.profile ">
  {{ app.user.profile.name }}
</div>
````


### How to know profile is loaded already.

* To use `UserService.profile` safely.

````

  constructor() {
    this.subscriptionLoadProfile = this.app.user.loadProfile.subscribe(load => {
      console.log("profile loaded? ", load); // true of false.
    });
  }

  ngOnDestroy() {
    this.subscriptionLoadProfile.unsubscribe();
  }

````





## Secret Key

Every time a user logs in( or refresh the site ), it will get a security key form `/user/secret`. If security key does not exist for that user, it wil generate one.

Secret key is very important key and only readable by the owned-user.

* Security hole: If a bad user inputs a lot of junk data in `/user/secret/.../...`, there is no problem with securty but bad data may be stacked over and over consuming a lot of spaces.
* @todo: To improve this, It needs to be coded it in `Restful API`

````
    "user": {
      "secret": {
        "$uid": {
          ".read": "$uid === auth.uid",
          ".write": "!data.exists() || !newData.exists() || $uid === auth.uid"
        }
      }
    }
````


* if wrong `uid` or wrong `secret` passed, `secret_does_not_match` error will be thrown.




# CODE FLOW


## User

### User login initialization

* App run => app.component => app.service => UserService => onAuthStateChanged()
  * if already logged in => getOrGenerateSecretKey()
  * if already logged in => `loginStatus` = 'login', getProfile() => set user profiel data to `this.profile`
  * if not logged in => `loginStatus` = 'logout', null to `this.profile`



### Login Flow

* facebook login click => app.loggedIn() => wait with onAuthStateChanged() until login => user.updateProfile()
* kakao login click => kakao.Auth.login() success => app.thirdPartySocialLoginSuccessHandler()
  => app.socialFirebaseEmailLogin() => [ If login failed app.app.socialFirebaseEmailRegister ] => app.socialLoggedIn()
  => user.updateProfile()

* Go to profile page => user.getProfile() => Display user information.
* Profile form submit => user.updateProfile()


### Secret code creation flow

* Login or Registration => onAuthStateChanged() ( => if the user has no secret? then create one ) => get secret key.



### Login Status

It is important to understand how login status changes.

When app first loads, login status is always pending(not checked) until it access to database using 'onAuthStateChanged()'.
When app calls 'onAuthStateChanged()', it will access database and it may be returned with null, meaning the user is not logged in.
And later, when user logs in, 'onAuthStateChange()' may be returned with 'user info', meaning the user is now logged in.

When app try to get user information from database, the app must do it ONLY IF the user has logged in.

  * What if the developer don't want to check if user has logged in? because it is a tedious task that you have to write the same code every where.

So, there is a helper getters.


* `UserService.isPending` is true when app is loading and before calling `onAuthStateChanged()`. The app does not know yet, if the user has logged in or not.
* After `onAuthStateChanged()` is called, `.isPending` becomes 'false' and one of `.isLogin` or `.isLogout` will be true and the other will false.
* `.isLogin` may be 'false' after calling `onAuthStateChanged()` but later ( without refreshing the site ), `.isLogin` can be 'true'.

* The difficult part is that 'login status' changes without refresh the site so the developer must monitor 'login status' changes.

* And there are more to consider;
  
  * When user logs in for the first time, there is no secure key yet. and the app is trying to access to it, unexpected result may happens.

````

<div *ngIf=" user.isLogin ">
  You are logged in as <b>{{ user.auth.currentUser.displayName }}</b>
  <button (click)=" user.logout() ">Loggout</button>
  <div>Who am I? : {{ user.name }}</div>
  <div>Am I admin? {{ user.isAdmin }}</div>
</div>
<div *ngIf=" user.isLogout ">
  * You are not logged in !!
</div>


````


* Attention: Use `.isLogin`, `.isLogout`, `.isPending` to check user login status.
  * If you are going to use in other way around like
    * using `UserSerivce.profile` and in template to see if the user logged in/out is a mistake.
    Because you can logout, and `this.profile` still have a value. It is not easy write 100% clean code.

* If you need to use user's profile data in template, keep it in mind that profile data may not be available until the app completes `onAuthStateChanged()` (the socket connection) from database.

* Use `UserService.getProfile()`. It is a safe way.




### Best practice with login status or other coding.

* Very important : Follow Firebase coding flow.

  * See : https://docs.google.com/document/d/1xNDf6hYyBXWrYhBb4y5gV84MhNgKFdiBE0BYT97GpzE/edit#heading=h.f67mmu2bsz7

  * Firebase uses `Promises`. Just use `Promises` and every thing will be okay. Or you will has trouble.

  * Don't cache `database data` on memory or localStorage

    * For instance, if you are going to load user profile data and save it to memory or localStorage for fast load in the future, the problem begins from here.

    * Even thouggh it is a little bit slow on connecting and loading `Firebase Database`, just do it every time without caching.



* Since we are going to use SPA, once user has logged in, the user will always be logged in throught the session unless the user refreshes the site.

* For instance, if the user is on 'profile' page and refreshes the site, then the app will be in 'pending' while booting.

  * If the app tries to get user profile, the app may be in 'pending' state for user login.
  * So, this may throw an error.
  * To avoid the error, user `UserService.loadProfile` subscription.



Recommended way to check user profile)

````
<div *ngIf=" app.user.profile ">
  Welcome, {{ app.user.profile.name }} ( {{ app.user.profile.photoURL }})<br>
  Am i admin? : {{ app.user.isAdmin }}
</div>
````



### User Data availability check.

* When `onAuthStateChanged()` as login, it loads profile at `UserService.profile`.

  * Warning. DO NOT use this when you are going to update user profile.
    Because it is not updated in real-time.
    For instance, your name was 'Peter' and if you change your name to 'abc' and then you create a post, then your name will still be 'Peter' not 'abc'.
    This is not a big problem.
    BUT if you use `UserService.profile` after you change name, your name may appear in old name.

  * Only use this for reference like when you are going to post.


* Use `UserSerivce.checkLogin()` to see if the user has already logged or not.



* You can simply use `onAuthStateChnaged()` to make sure if user has logged in.

````
this.user.auth.onAuthStateChanged((user: firebase.User) => {
    if ( user ) { // user logged in.
        /// do what ever
    }
    else {
        
    }
});
````

* To get user profile,
````
  UserService.getProfile(p => console.log(p), e => console.error(e));
````



## Forum Category

It is a bad idea to watch the database to know `category` update.

You can do whatever without watch the database.

Remember. Realtime Database gives you realtime update. But don't do realtime update where you don't ever need it like category update.

For CRUD of category, realtime update may help. BUT for Showing category only like in POST CREATE page, realtime update worses the app.




# Database Structure

## User Data

* /user/secret
  is the user secret

* /user/profile
  is the user profile

## Admin

* /admin
  is the admins.


## Forum



# TEST

## How to setup test evnvironment.

### TEST on CLI

Developer can run test code on CLI.

* Edit ./firebase-backend/test.ts
* Run `tsc`
* Run `node test`


### TEST on cliend-end with Anuglar in Browser.

For some test like Firebase email/password registraion, should be done in client-end.


Developer can;

* Edit ./firebase-backend/functions/model/test/test.ts
* Inject the TestService
* Invoke `TestServer::run()`



### Other test method.

* You can test 




## TEST Authentication

Backend as of firebase-backend, only needs `uid` and `secure key` to get the permission/authentication.





# SEO

## Friendly URL

* Post subject will become the `post-subject` key that tells which post it is link to.
* All special spaces will be chagned into dashes(-) and all special characters will be deleted in 'friendly url'.



Database structure will be:
````
`/post/friendly-url/{post-subject: pushkey}`
````

* If the key of `post-subject` is already exists, then the key will be formed in `post-pushkey-subject`.

  For instance,
  * If post key is `12345abcde`
  * If post subject is `hello how are you?`

  Then it will be saved as

````
/post/friendly-url/hello-how-are-you
````

* If the same subject is written, then

````
/post/friendly-url/pushKey-hello-how-are-you
````

will be created.

* If the subject is empty, then push-key will be used as friendly url.


# Error Handling

To make it simple, all error is a string which is called 'error code'.

When error is return from api, you can ignore error.message on front end.

When an Error object is thrown, the 'message' property will have its error code.

'error code' without 'error message' or extra information may make debug diffcult but extremely simple to handle.




# Comment Structur

폴더 구조가 아래와 같은데, 문제 점은 1개의 글에 코멘트가 수천개 있을 경우, 마지막 10개만 보여주어야하는데, 그 마지막 10개에 자식 코멘트가 많이 들어가 있을 수 있다.
이 때에는 어쩔 수 없이 무시를 하고 그냥 마지막 10개의 코멘트를 가져와서 보여주고, 더보기를 클릭하면 모두 보여준다.




````
/forum/comment/-post-push-key/-comment-A
                                -comment-A-1
                                  -comment-A-1-1
                                  -comment-A-1-2
                                -comment-A-2
                                -comment-A-3
                              -comment-B
                                ...
                                  ...
                                    ...
                                      ...
                                    ...
                                    ...
                                    ...
                                      ...
                                        ...
                                          ...
                                            ...
                                              ...
                                                ...
                                              ...
                                        ...
                                  ...
                                ...
                              -comment-C
````
