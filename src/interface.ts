
/**
 * Defines
 */

export const PROFILE_KEY = 'user-profile-key';



/**
 * Paths
 */
export const CATEGORY_PATH = 'forum/category';
export const POST_DATA_PATH = 'forum/post/data';
export const POST_FRIENDLY_URL_PATH = 'forum/post/friendly-url';
export const CATEGORY_POST_RELATION_PATH = 'forum/category-post-relation';
export const ALL_CATEGORIES = 'all-categories';
export const COMMENT_PATH = 'forum/comment';

export const USER_PUSH_TOKEN_PATH = 'user/push-token';


export const SECRET_KEY_PATH = 'user/secret';
export const PROFILE_PATH = 'user/profile';





/**
 * User
 */


/**
 * This is user common data. This data structure has the same strcuture of database - /user/profile
 */
interface EMAIL {
    email?: string;
}

interface PASSWORD {
    password: string;
}

export interface USER_COMMON_DATA {
    providerId?: string;
    name?: string;              // displayName
    photoURL?: string;
    gender?: string;
    birthday?: string;
    mobile?: string;
}



export interface USER_REGISTER extends EMAIL, PASSWORD, USER_COMMON_DATA { }
export interface USER_UPDATE extends USER_COMMON_DATA { };

export interface SOCIAL_PROFILE extends EMAIL, USER_COMMON_DATA {
    uid?: string;
    password?: string;
};

export interface PROFILE extends SOCIAL_PROFILE {};



/**
 * Forum
 */

export interface CATEGORY {
    id: string;
    name?: string;
    description?: string;
    owner?: string;
}

export type CATEGORIES = Array<CATEGORY>;


interface REQUEST {
    function?: string;
    secret: string;
}

interface UID {
    uid: string;
}
interface KEY {
    key?: string;
}
interface CATEGORIES {
    categories: Array<string>;
}

interface POST_COMMON {
    name?: string;                  /// author name
    contact?: string;               /// author contact
    subject?: string;
    content?: string;
    sticky_forum?: boolean;
    sticky_all_forum?: boolean;
    stamp?: number;
    friendly_url_key?: string;              /// friendly url.
    files?: Array<string>;              /// upload file information.



    comments?: any;                     /// dynamic contents.
    user?: any;                         /// dynamic contents.

}

// export interface POST_CREATE extends REQUEST, UID, CATEGORIES, POST_COMMON {};
// export interface POST_EDIT extends POST_CREATE, KEY {};
export interface POST extends REQUEST, UID, KEY, CATEGORIES, POST_COMMON { };
export type POSTS = Array<POST>;




export interface COMMENT {
    function?: string;
    // ancestors: Array<string>;
    path: string;
    uid: string;
    secret?: string;
    content?: string;
    stamp?: number;
    files?: Array<string>;



    /// not exist in database.
    depth?: number;
    user?: any;
};

export type COMMENTS = Array<COMMENT>;


/**
 * Push Message
 */

export interface PUSH_MESSAGE {
    token?: string;
    uid: string;
    title: string;
    body: string;
    url?: string;
    icon?: string;
};