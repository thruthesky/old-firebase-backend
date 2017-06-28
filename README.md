# Firebase Backend

firebase-backend


# TODO

Refer issues



# How to work/code

* If you are coding firebase-backend under another project,
    * You should open 'firebase-backend' folder in a new 'VSCode' as a new porject.
    * And work in that folder independently from the parent project.



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


## No anonymous user

* Since we are planning only with social login, we don't do user authorization code.
* If there is a case for anonymous user could write, then just let them write but not editable and deletable.


## Interface

* POST.function is 'create' by default.
* When you are going to create/edit a post, you don't have to give 'function' property.
* It is determined by 'key' of the POST data. If 'key' does not exist, it's 'create'. If it has 'key' then, it is 'edit'.
* POST.function can be 'create', 'edit', 'delete'.

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



## Kakao login

When a user loggs in with Kakao, app will get a number of `id` and `email`.
`id` is used as `login id` and `email` is used as 'password'.
`id` and `email` must not be shown to public or others.
If you do not show `id` and `email` to public, the login will be very much safe.

* Remember: `id` will be login email, `email` will be password.


## Secret Key

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
