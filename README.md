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



## Profile

Every time a user logs in, his profile data will be updated by his social profile data. BUT other profile data like phone number will not be overwritten.

So, all user shall have a node under `/user/profile`.
And that node will be updated( NOT reset) when the user updates his profile on profile page.







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
* kakao login click => kakao.Auth.login() success => app.thirdPartySocialLoginSuccessHandler() => app.emailLogin() => [ If login failed app.emailRegister ] => app.loggedIn() => wait with onAuthStateChanged() until login => user.updateProfile()

* Go to profile page => user.getProfile() => Display user information.
* Profile form submit => user.updateProfile()




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
    * `UserSerivce.getProfile( p => this.profile = p)` and use it to check if the user login in template, that's a mistake.
    Because you can logout, and `this.profile` still have a value. It is not easy write 100% clean code.

* If you need to use user's profile data in template, keep it in mind that profile data may not be available until app completes the socket connection from database.

so, code like below

component class)
````
user.getProfile(profile => this.profile = profile, e => console.error(e));
````

template
````
<div *ngIf=" user.isLogin && profile ">
  {{ profile.name }}
</div>
````


Example of getProfile)
````
  this.app.user.getProfile(p => this.setProfile(p), e => {
    if ( isError(e.message, ERROR.user_not_logged_in ) )this.error = "You are not logged in";
    else this.error = e.message;
  });
````


### Best practice with login status or other coding.

* Very important : Follow Firebase coding flow.

  * See : https://docs.google.com/document/d/1xNDf6hYyBXWrYhBb4y5gV84MhNgKFdiBE0BYT97GpzE/edit#heading=h.f67mmu2bsz7

  * Firebase uses `Promises`. Just use `Promises` and every thing will be okay. Or you will has trouble.

  * Don't cache `database data` on memory or localStorage

    * For instance, if you are going to load user profile data and save it to memory or localStorage for fast load in the future, the problem begins from here.

    * Even thouggh it is a little bit slow on connecting and loading `Firebase Database`, just do it every time without caching.



* Since we are going to use SPA, once user has logged in, the user will always be logged in throught the session unless the user refreshes the site.

* For instance, if the user is on 'profile' page and refreshes the site, then the app will be in 'pending' while booting.

  * The app will try to get user profile since the user is on 'profile' page BUT the app may be in 'pending'.
  * So, there will be an error.
  * To avoid the error, developer can check login status and wait until 'pending' status changes to 'login' or 'logout'.
  * But this is tedious.

* Use `UserService.checkLogin( loginCallback, logoutCallback, errorCallback )` to know if user has logged in or not.

  * You don't have to worry about 'pending' with `checkLogin` since it will callback after `onAuthStateChanged()`.




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

# TEST Authentication

Backend as of firebase-backend, only needs `uid` and `secure key` to get the permission/authentication.

