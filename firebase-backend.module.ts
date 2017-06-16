import { NgModule } from '@angular/core';

import { ForumService } from './functions/model/forum/forum.service';
export { ForumService } from './functions/model/forum/forum.service';


export { CATEGORY, CATEGORIES, POST } from './functions/model/forum/forum.interface';



import { UserService } from './functions/model/user/user.service';
export { UserService } from './functions/model/user/user.service';



@NgModule({
    providers: [ ForumService, UserService ],
})
export class FirebaseBackendModule {}
