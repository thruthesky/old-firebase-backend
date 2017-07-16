import * as firebase from 'firebase';
import { Forum } from './forum';
import { ERROR } from '../error/error';


import {
    CATEGORY_PATH, CATEGORY, CATEGORIES, POST,
    POST_DATA_PATH, CATEGORY_POST_RELATION_PATH, ALL_CATEGORIES,
    POST_FRIENDLY_URL_PATH, COMMENT, COMMENT_PATH
} from './../../interface';


export class ForumInterface extends Forum {

    /**
     * It does all the extra works that are needed to create a post.
     *      - category
     *      - friendly url
     *
     * @param post Post data to create
     * @return a promise with post key.
     */
    async createPost(post: POST): Promise<any> {
        if (this.checkPost(post)) return this.error(this.checkPost(post));
        if (post.key) return this.error(ERROR.post_key_exists_on_create);
        await this.categoriesExist(post.categories);
        let ref = this.postData().push();

        // check if friendly url exists.
        // if not exists create one with title.
        // if exists, create with push-key + title.

        let friendlyUrlKey = await this.createFriendlyUrl(ref.key, post.subject);

        post.friendly_url_key = friendlyUrlKey;

        delete post.secret;
        return this.setPostData(ref, post);
    }

}