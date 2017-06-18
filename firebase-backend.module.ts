import { NgModule } from '@angular/core';

import { ApiService } from './functions/model/api/api';
export { ApiService } from './functions/model/api/api';


import { TestService } from './functions/model/test/test';
export { TestService } from './functions/model/test/test';

import { ForumService } from './functions/model/forum/forum.service';
export { ForumService } from './functions/model/forum/forum.service';

import { Forum } from './functions/model/forum/forum';
export { Forum } from './functions/model/forum/forum';


export { CATEGORY, CATEGORIES, POST, POSTS, ALL_CATEGORIES } from './functions/model/forum/forum.interface';

import { UserService } from './functions/model/user/user.service';
export { UserService } from './functions/model/user/user.service';

@NgModule({
    providers: [ ForumService, UserService, ApiService, TestService ],
})
export class FirebaseBackendModule {}

