import * as firebase from 'firebase';
import { AdvertisementTool } from './advertisement-tool';
import { ERROR } from '../error/error';


import {
    CATEGORY_PATH, CATEGORY, CATEGORIES, POST,
    POST_DATA_PATH, CATEGORY_POST_RELATION_PATH, ALL_CATEGORIES,
    POST_FRIENDLY_URL_PATH, COMMENT, COMMENT_PATH
} from './../../interface';


export class AdvertisementToolInterface extends AdvertisementTool {

    
    /**
     * 
     * @param params User input
     * @return a promise with advertisement key ( that is just created )
     * 
     */
    async create( params ) {
        let ref = this.db.push();
        return ref.set(params).then( () => ref.key );
    }

    
}