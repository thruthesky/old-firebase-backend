# Firebase Backend

firebase-backend


# TODO

* Backend gets 'uid' as user push key and trust it. but a user can send any data in 'uid' and it could lead a security problem. But it is impossible to use other's 'uid'. so it is trustable. 'uid' is more likely a password.





# Installation


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
