import { NgModule } from '@angular/core';

import { ApiService } from './src/model/api/api';
export { ApiService } from './src/model/api/api';


import { TestService } from './src/model/test/test';
export { TestService } from './src/model/test/test';

import { ForumService } from './src/model/forum/forum.service';
export { ForumService } from './src/model/forum/forum.service';

import { Forum } from './src/model/forum/forum';
export { Forum } from './src/model/forum/forum';


export { ERROR, isError } from './src/model/error/error';


export {
    CATEGORY, CATEGORIES, POST, POSTS, ALL_CATEGORIES, COMMENT, COMMENTS,
    SOCIAL_PROFILE, USER_REGISTER, USER_UPDATE, PROFILE
} from './src/interface';

import { UserService } from './src/model/user/user.service';
export { UserService} from './src/model/user/user.service';

@NgModule({
    providers: [ ForumService, UserService, ApiService, TestService ],
})
export class FirebaseBackendModule {}

